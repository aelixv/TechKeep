function userCollection(db) {
  return db.collection("users");
}

module.exports = { userCollection };