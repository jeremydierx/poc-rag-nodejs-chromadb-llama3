![Le RAG donne des super pouvoirs à votre model d’IA générative !](https://blog.code-alchimie.fr/10/05/2024/poc-rag-nodejs-chromadb-llama3/rag.webp)

## Introduction
Dans cet article, nous allons explorer la création d’un POC (Proof of Concept) pour un système de RAG (Retrieval Augmented Generation) en utilisant [Node.js](https://nodejs.org/), une base de données vectorielle [ChromaDB](https://www.trychroma.com/), et le modèle de langage [Llama3](https://ollama.com/library/llama3) via [Ollama](https://ollama.com/).

### Qu'est-ce qu'un RAG ?
Un RAG, ou Retrieval Augmented Generation, est une technique qui combine la recherche d'informations pertinentes dans une base de données (retrieval) avec la génération de texte (generation) pour fournir des réponses plus précises et contextuelles. En d'autres termes, un RAG peut récupérer des données spécifiques et utiliser un modèle de langage pour générer une réponse en se basant sur ces données, ce qui le rend particulièrement utile pour des applications nécessitant des réponses détaillées et informées.

### Qu'est-ce que ChromaDB et une base de données vectorielle ?
[ChromaDB](https://www.trychroma.com/) est une base de données vectorielle, un type de base de données spécialement conçu pour stocker et rechercher des vecteurs. Les vecteurs sont des représentations numériques de données (comme des textes ou des images) qui permettent de mesurer la similarité entre ces données. Dans le cas présent, [ChromaDB](https://www.trychroma.com/) est utilisée pour rechercher des phrases similaires à la question posée, ce qui aide à récupérer les informations les plus pertinentes pour générer une réponse précise.

### Qu'est-ce qu'Ollama ?
[Ollama](https://ollama.com/) est un outil qui facilite l’utilisation de modèles de langage de grande taille (LLM) comme Llama3. Il permet de gérer facilement ces modèles et de les intégrer dans des applications. Dans ce POC, [Ollama](https://ollama.com/) est utilisé pour générer des réponses basées sur les données récupérées par ChromaDB, ajoutant une couche de compréhension et de génération de texte naturel.

### Qu'est-ce qu'un LLM (Llama3) ?
Un LLM (Large Language Model), comme [Llama3](https://ollama.com/library/llama3), est un modèle d'intelligence artificielle entraîné sur de vastes quantités de données textuelles. Ces modèles peuvent comprendre et générer du texte en langage naturel de manière très sophistiquée. Dans ce POC, [Llama3](https://ollama.com/library/llama3) est utilisé pour transformer les données récupérées en réponses claires et pertinentes, améliorant ainsi l’expérience utilisateur en fournissant des informations complètes et bien formulées.

Nous allons détailler chaque étape pour vous permettre de reproduire ce POC facilement.

## Prérequis
Avant de commencer, assurez-vous d’avoir les éléments suivants installés sur votre machine :
- Ubuntu 22.04 (mais cela devrait fonctionner sur les autres OS)
- Node.js (version 20 ou supérieure)
- npm (Node Package Manager)
- Python3 (pour lancer le serveur ChromaDB)

## Objectif

Notre dataset contient des informations sur des personnes et des animaux. Nous allons utiliser ChromaDB pour stocker ces informations et rechercher des données pertinentes en fonction de la question posée. Ensuite, nous utiliserons Ollama avec le modèle Llama3 pour générer une réponse basée sur les données récupérées. Voici les informations dont nous disposons :

***"Alex porte un bonnet vert"***
***"Alex est un homme"***
***"Laura conduit une voiture bleue"***
***"Laura est une femme"***
***"Médore joue avec une balle blanche"***
***"Médore est un chien"***
***"Minou fait ses griffes sur le canapé"***
***"Minou est un chat"***
***"Sam a les cheveux longs"***
***"Sam est un enfant"***

La question posée sera : ***"Que fait le chat ?"***. Nous allons rechercher des données similaires dans notre dataset, puis utiliser Ollama avec Llama3 pour générer une réponse basée sur ces données.

## Principe de fonctionnement de notre RAG
![Diagramme de flux du RAG](https://blog.code-alchimie.fr/10/05/2024/poc-rag-nodejs-chromadb-llama3/poc-rag-nodejs-chromadb-llama3-diagram.svg)

## Étape 1 : Installer ChromaDB
Commencez par installer ChromaDB sur votre système Linux Ubuntu :

``` bash
$ pip install chromadb
```

Démarrer le serveur ChromaDB :

``` bash
$ mkdir ~/rag-app
$ mkdir ~/rag-app/db
$ chroma run --path  ~/rag-app/db
```

## Étape 2 : Installer Ollama et Llama3
Nous allons maintenant installer Ollama, Llama3 et démarrer le service (dans une autre console) :

``` bash
$ curl -fsSL https://ollama.com/install.sh | sh
$ ollama run llama3
```


## Étape 3 : Installer les dépendances pour Node.js
Nous allons maintenant créer un script en Node.js pour interagir avec ChromaDB et Ollama. Commençons par installer les packages nécessaires :

``` bash
$ cd ~/rag-app
$ npm init
$ npm install chromadb ollama
$ touch rag.js
```
## Étape 3 : Initialiser ChromaDB et Ollama (rag.js)

``` javascript
const ollama = require('ollama').default

const {
  ChromaClient,
  DefaultEmbeddingFunction
} = require('chromadb')

const client = new ChromaClient()
const embedder = new DefaultEmbeddingFunction()
```

## Étape 4 : Définir les Données et la Collection

Ajoutons les documents et la collection à ChromaDB (dataset) :

``` javascript
const collectionName = 'docs'

// le choix du modèle
const model = 'llama3'

// le dataset
const documents = [
  "Alex porte un bonnet vert",
  "Alex est un homme",
  "Laura conduit une voiture bleue",
  "Laura est une femme",
  "Médore joue avec une balle blanche",
  "Médore est un chien",
  "Minou fait ses griffes sur le canapé",
  "Minou est un chat",
  "Sam a les cheveux longs",
  "Sam est un enfant"
]

console.log(`
--- Documents de départ ---\n
${documents.join('\n')}`)
```

## Étape 5 : Supprimer et Créer une Collection
Nous allons ajouter les fonctions pour supprimer et créer une nouvelle collection dans ChromaDB :

  ``` javascript
// on supprime la collection si elle existe
async function deleteCollection(name) {
  try {
    await client.deleteCollection({ name })
    return true
  } catch (error) {
    console.error('Error deleting collection', error)
  }
}

// on crée la collection (docs)
async function createCollection(name) {
  try {
    const collection = await client.createCollection({
      name,
      embeddingFunction: embedder
    })
    return collection
  } catch (error) {
    console.error('Error creating collection', error)
  }
}
```

## Étape 6 : Ajouter des Documents à la Collection
Ajoutons les documents dans la collection que nous venons de créer :

``` javascript
// on ajoute les documents à la collection
async function addToCollection(collection) {
  try {
    const ids = documents.map((_, i) => i.toString())
    await collection.add({
      ids,
      documents,
      embeddings: await embedder.generate(documents)
    })
    return collection
  } catch (error) {
    console.error('Error adding items to collection', error)
  }
}
```

## Étape 7 : Recherche par Similarité
Implémentons la recherche par similarité dans la collection :

``` javascript
// on recherche dans la collection par similarité
async function searchInCollection(collection) {
  try {
    const nResults = 2
    const question = 'Que fait le chat ?'
    console.log(`--- Question ---\n\n${question}\n`)
    const results = await collection.query({
      nResults,
      queryEmbeddings: await embedder.generate([question])
    })
    const data = results.documents[0].join(', ')
    console.log(`--- Données proches retrouvées en DB (${nResults} résultats max) ---\n\n${data}\n`)
    return data
  } catch (error) {
    console.error('Error searching in collection', error)
  }
}
```

### Étape 8 : Générer la Réponse avec Ollama / LLama3
Nous allons maintenant utiliser Ollama pour générer une réponse à partir des données trouvées :

``` javascript
// on génère la réponse à partir des données trouvées
async function generateResponse(data) {
  try {
    const { response } = await ollama.generate({
      model,
      prompt: `En utilisant ces données : ${data}. Répond à cette question : Quel est le sexe de la personne qui porte des gants ?`
    })
    console.log(`--- Réponse de ${model} ---`)
    console.log(response)
    console.log()
    return response
  } catch (error) {
    console.error('Error generating response:', error)
  }
}
```

## Étape 9 : Exécuter les Fonctions
Pour finir, créons une fonction principale pour exécuter toutes les étapes séquentiellement:

``` javascript
// on exécute les fonctions
function main(){
  deleteCollection(collectionName)
  .then(deleted => {
    return createCollection(collectionName)
  })
  .then(collection => {
    return addToCollection(collection)
  })
  .then(collection => {
    return searchInCollection(collection)
  })
  .then(data => {
    return generateResponse(data)
  })
}

// start!
main()
```
## Conclusion
En suivant ces étapes, vous pouvez créer un POC de RAG en utilisant Node.js, ChromaDB et Llama3 via Ollama. Ce processus vous permet d’explorer la puissance des bases de données vectorielles et des modèles de langage avancés pour améliorer vos applications web avec des capacités de génération de réponses enrichies par la récupération d’informations pertinentes.

N’hésitez pas à adapter ce script à vos propres besoins et à explorer d’autres fonctionnalités de ChromaDB et Ollama pour aller plus loin dans l’innovation technologique.

Vous pouvez retrouver mes articles tech sur : [https://blog.code-alchimie.fr](https://blog.code-alchimie.fr)

Jérémy @ [Code Alchimie](https://code-alchimie.fr)