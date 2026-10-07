function productCollection(db) {
  return db.collection("products");
}

module.exports = { productCollection };