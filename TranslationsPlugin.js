/** @author: yashvesikar */
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const { Compilation } = webpack;
const { RawSource } = webpack.sources;

const CustomTranslationCallTag = Symbol("CustomTranslationCallTag");

function readJsonFile(filePath) {
  // slowest possible way to read a file - probably the biggest bottleneck of the whole plugin
  const fileData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(fileData);
  return jsonData;
}

class TranslationPlugin {
  constructor() {
    this.translationsMap = new Map();
    this.translations = {};

    this.translationManifest = {};
    this.emitTranslationBundle = this.emitTranslationBundle.bind(this);
    this.generateTranslationsMap = this.generateTranslationsMap.bind(this);
  }

  apply(compiler) {
    if (compiler.options.name !== "client") {
      return;
    }

    this.generateTranslationsMap(compiler);

    // compiler.hooks.emit.tap(
    compiler.hooks.thisCompilation.tap(
      "TranslationPlugin",
      // client side only
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "TranslationPlugin",
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          (_) => {
            const { entrypoints } = compilation;
            entrypoints.forEach((entrypoint) => {
              this.emitTranslationBundle(compiler, compilation, entrypoint);
            });
          }
        );
        return true;
      }
    );
  }

  /**
   * Extracts all the t("") function call arguments.
   * This could technically be done in a webpack loader using clever regex but by using the AST the solution is technically more correct in generic albeit slower.
   * @param {webpack.Compiler} compiler
   */
  generateTranslationsMap(compiler) {
    compiler.hooks.normalModuleFactory.tap("TranslationPlugin", (factory) => {
      factory.hooks.parser
        .for("javascript/auto")
        .tap("TranslationPlugin", (parser) => {
          // find const `t = useTranslations()`
          // and tag the variable `t`
          parser.hooks.evaluateIdentifier
            .for("useTranslations")
            .tap("TranslationPlugin", () => {
              // get the current statement
              const currentStatement = parser.statementPath.at(-1);
              // ensure that the statement is a variable declaration
              // e.g. const t = useTranslations()
              if (
                !currentStatement ||
                currentStatement.type !== "VariableDeclaration"
              ) {
                return;
              }
              // get th last declaration
              // e.g.
              // const x, y, t = useTranslations()
              const lastVariableDeclarator =
                currentStatement.declarations[
                  currentStatement.declarations.length - 1
                ];
              if (
                !lastVariableDeclarator ||
                lastVariableDeclarator.type !== "VariableDeclarator"
              ) {
                return;
              }
              // check if useTranslations was called:
              if (lastVariableDeclarator.init.type !== "CallExpression") {
                return;
              }
              // get the identifier name
              // e.g. const t = useTranslations() // -> t
              const variableName = lastVariableDeclarator.id.name;
              if (!variableName) {
                return;
              }
              parser.tagVariable(variableName, CustomTranslationCallTag);
            });

          // find all call expressions to declared variable name i.e. t("key") function and extract the argument "key"
          // generate the translation map module identifier -> {key1, key2, ...}
          parser.hooks.expression
            .for(CustomTranslationCallTag)
            .tap("TranslationPlugin", (expr, ...args) => {
              let position = expr.end;
              // find the first opening bracket
              for (
                position;
                position < parser.state.source.length;
                position++
              ) {
                if (parser.state.source[position] === "(") {
                  break;
                }
                if (/\s/.test(parser.state.source[position]) === false) {
                  return;
                }
              }
              // break if no opening bracket was found
              if (position === parser.state.source.length) {
                return;
              }
              let quote = "";
              // find the first quote or double quote
              for (
                position;
                position < parser.state.source.length;
                position++
              ) {
                quote = parser.state.source[position];
                if (quote === '"' || quote === "'") {
                  break;
                }
              }
              // find the closing quote or double quote which is not escaped
              for (
                position++;
                position < parser.state.source.length;
                position++
              ) {
                if (
                  parser.state.source[position] === quote &&
                  parser.state.source[position - 1] !== "\\"
                ) {
                  break;
                }
              }
              // extract the key
              const key = parser.state.source.substring(expr.end + 2, position);
              // replace escaped quotes
              const id = parser.state.current.identifier();
              // remember for current file id
              const keysFromMap = this.translationsMap.get(id);
              const keys = keysFromMap || new Set();
              keys.add(key);
              if (!keysFromMap) {
                this.translationsMap.set(id, keys);
              }
            });
        });
    });
  }

  /**
   * Emit translation bundle for each entrypoint with only the translations used in the entrypoint
   * @param {webpack.Compilation} compilation
   * @param {*} entrypoint
   * @returns
   */
  emitTranslationBundle(compiler, compilation, entrypoint) {
    this.translations = {
      en: {
        "client.tsx": "EN:client.tsx",
        "client2.tsx": "EN:client2.tsx",
        "client3.tsx": "EN:client3.tsx",
        "hybrid.tsx": "EN:hybrid.tsx",
      },
    };

    const languages = Object.keys(this.translations);

    // find all modules used in each entrypoint
    const entryPointTranslations = new Map();
    const entrypointTranslationMap = {};
    const entrypointName = entrypoint.options.name;
    entrypoint._modulePostOrderIndices.forEach((_, value) => {
      const identifier = value.identifier();
      const moduleTranslations = this.translationsMap.get(identifier);
      if (!moduleTranslations) {
        return;
      }
      languages.forEach((locale) => {
        entrypointTranslationMap[locale] = entrypointTranslationMap[locale] || {};
        const moduleTranslationMap = entrypointTranslationMap[locale];
        moduleTranslations.forEach((key) => {
          moduleTranslationMap[key] = this.translations[locale][key] || "__MISSING__";
        });
      });
    });

    console.log("entryPointTranslations", entryPointTranslations);

    // emit the translation bundles
    languages.forEach((locale) => {
      const relativeOutputPath = path.join(
        "i18n",
        entrypointName,
        `${locale}.json`
      );
      compilation.emitAsset(
        relativeOutputPath,
        new RawSource(JSON.stringify(entrypointTranslationMap[locale] || {}))
      );
    });
  }
}

module.exports = TranslationPlugin;
