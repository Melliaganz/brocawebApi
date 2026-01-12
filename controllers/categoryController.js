const Category = require("../models/Category");
const Article = require("../models/Article");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des catégories" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Le nom de la catégorie est requis." });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Cette catégorie existe déjà." });
    }

    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryToDelete = await Category.findById(id);
    if (!categoryToDelete) {
      return res.status(404).json({ message: "Catégorie introuvable." });
    }

    const articleCount = await Article.countDocuments({
      categorie: categoryToDelete.name,
    });

    if (articleCount > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer : ${articleCount} article(s) utilisent encore cette catégorie.`,
      });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Catégorie supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
};
