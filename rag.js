const ollama = require('ollama').default

const {
  ChromaClient,
  DefaultEmbeddingFunction
} = require('chromadb')

const client = new ChromaClient()
const embedder = new DefaultEmbeddingFunction()

const collectionName = 'docs'

// le choix du modèle <--
const model = 'llama3'

// le dataset <--
documents = [
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
${documents.join('\n')}\n`)

// le nombre de résultats récupérés par similarité depuis la DB <--
const nResults = 2

// la question <--
const question = 'Que fait le chat ?'
console.log(`--- Question ---\n\n${question}\n`)
// on supprime la collection si elle existe
async function deleteCollection(name) {
  try {
    await client.deleteCollection({
      name
    })
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
    return coll
  } catch (error) {
    console.error('Error adding items to collection', error)
  }
}

// on récupère les items de la collection (uniquement pour tester)
async function getItemsFromCollection(name) {
  try {
    const collection = await client.getCollection({ name })
    console.log(await coll.get())
    return collection
  } catch (error) {
    console.error('Error get items from collection', error)
  }
}

// on recherche dans la collection par similarité
async function searchInCollection(collection) {
  try {
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

// on génère la réponse à partir des données trouvées
async function generateResponse(data) {
  try {
    const { response } = await ollama.generate({
      model,
      prompt: `En utilisant ces données : ${data}. Répond à cette question : ${question}`
    })
    console.log(`--- Réponse de ${model} ---\n${response}`)
    return response
  } catch (error) {
    console.error('Error generating response:', error)
  }
}

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