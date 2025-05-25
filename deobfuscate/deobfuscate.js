/**
 * Deobfuscator.js
 * The babel script used to deobfuscate the target file
 *
 */
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;
const beautify = require("js-beautify");
const { readFileSync, writeFile } = require("fs");
const Ot = require("./decoder_Ot");
const mt = require("./decoder_mt");

/**
 * Main function to deobfuscate the code.
 * @param source The source code of the file to be deobfuscated
 *
 */
function deobfuscate(source) {
  let decode_function = { Ot: Ot, mt: mt };

  const deobfuscateStringVisitor = {
    Program(path) {
      const globalMapping = { Ot: "Ot", mt: "mt" };

      // recursive function to track scoped aliasing
      function processPath(path, currentMapping) {
        path.traverse({
          VariableDeclarator(varPath) {
            const { id, init } = varPath.node;
            if (t.isIdentifier(id) && t.isIdentifier(init)) {
              if (init.name in currentMapping) {
                currentMapping[id.name] = currentMapping[init.name];
              }
            }
          },

          AssignmentExpression(assignPath) {
            const { left, right } = assignPath.node;
            if (t.isIdentifier(left) && t.isIdentifier(right)) {
              if (right.name in currentMapping) {
                currentMapping[left.name] = currentMapping[right.name];
              }
            }
          },

          CallExpression(callPath) {
            const { callee, arguments: args } = callPath.node;
            if (
              t.isIdentifier(callee) &&
              callee.name in currentMapping &&
              args.length === 1 &&
              t.isNumericLiteral(args[0])
            ) {
              try {
                const trueValue = decode_function[currentMapping[callee.name]](
                  args[0].value
                );
                callPath.replaceWith(t.stringLiteral(trueValue));
              } catch (e) {
                console.log(
                  `Error decoding ${callee.name} (${
                    currentMapping[callee.name]
                  }) with argument ${args[0].value} at line ${
                    innerPath.node.loc?.start.line
                  }`
                );
              }
            }
          },

          Function(path) {
            // Clone current mapping for function scope
            const localMapping = { ...currentMapping };
            processPath(path.get("body"), localMapping);
            path.skip(); // prevent double-traversing
          },
        });
      }

      // start traversal with global mapping
      processPath(path, globalMapping);
    },
  };

  const simplifyMemberExpressionVisitor = {
    MemberExpression(path) {
      const { computed, property } = path.node;
      if (
        computed &&
        t.isStringLiteral(property) &&
        /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(property.value)
      ) {
        // Convert to non-computed
        path.node.computed = false;
        path.node.property = t.identifier(property.value);
      }
    },
  };

  //Parse AST of Source Code
  const ast = parser.parse(source);

  // Execute the visitor
  traverse(ast, deobfuscateStringVisitor);
  traverse(ast, simplifyMemberExpressionVisitor);

  // Code Beautification
  let deobfCode = generate(ast, { comments: false }).code;
  deobfCode = beautify(deobfCode, {
    indent_size: 2,
    space_in_empty_paren: true,
  });
  // Output the deobfuscated result
  writeCodeToFile(deobfCode);
}
/**
 * Writes the deobfuscated code to a file
 * @param code The deobfuscated code
 */
function writeCodeToFile(code) {
  let outputPath = "2.26.481_deobfuscated.js";
  writeFile(outputPath, code, (err) => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log(`Wrote file to ${outputPath}`);
    }
  });
}

deobfuscate(readFileSync("./2.26.481.js", "utf8"));
