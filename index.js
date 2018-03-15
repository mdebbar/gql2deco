const fs = require('fs');
const path = require('path');
const { parse } = require('graphql/language/parser');
const { print } = require('graphql/language/printer');

const SAMPLES_PATH = 'samples';

// special graphql arguments.
const FLAVOR_ARGUMENT = 'as';

fs.readdir(SAMPLES_PATH, (err, files) => {
  if (err) {
    throw err;
  }
  files.forEach((file) => {
    if (file.endsWith('.gql')) {
      process(file);
    }
  });
});

function process(file) {
  const source = path.join(SAMPLES_PATH, file);
  const destination = path.join(SAMPLES_PATH, file + '.deco');
  fs.readFile(source, 'utf8', (err, content) => {
    if (err) {
      throw err;
    }
    fs.writeFile(destination, transform(content), 'utf8', () => {});
  });
}

function transform(gqlQuery) {
  const doc = parse(gqlQuery, { noLocation: true });
  // console.log(j(doc));

  // loop through multiple query operations.
  const decoParts = doc.definitions.map(def => transformNode(def));
  const decoSpec = decoParts.join('\n');
  console.log('\n-------------------\n');
  console.log(decoSpec);
  console.log('\n-------------------\n');
  return decoSpec;
}

function transformNode(node) {
  switch (node.kind) {
    case 'OperationDefinition':
      return `[${node.name.value}]${tv(node)}${tf(node)}`;
    case 'Field':
      return `${node.name.value}${tv(node)}${tf(node)}`;
    case 'InlineFragment':
      return `%${node.typeCondition.name.value}%${tf(node)}`;
  }
  return '';
}

// tv = transform variant/flavor
function tv(node) {
  if (node.arguments) {
    const flavor = node.arguments.find(arg => arg.name.value === FLAVOR_ARGUMENT);
    if (flavor) {
      return `~${flavor.value.value}`;
    }
  }
  return '';
}

// tf = transform fields
function tf(node) {
  if (node.selectionSet) {
    const { selections } = node.selectionSet;
    const decoFields = selections.map(sel => transformNode(sel)).join(',');
    return `(${decoFields})`;
  }
  return '';
}

function j(obj) {
  return JSON.stringify(obj, null, 2);
}

