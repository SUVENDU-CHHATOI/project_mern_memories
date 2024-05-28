import express from "express";
import mongoose from "mongoose";

import PostMessage from "../models/postMessage.js";

const router = express.Router();

export const getPosts = async (req, res) => {
  // this function will get all the posts from the database based on the page number
  const { page } = req.query;
  try {
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
    const total = await PostMessage.countDocuments({});
    const posts = await PostMessage.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .skip(startIndex); // for page=3 , it will skip all posts of the first 2 pages and show the 3rd page posts which are 8 (LIMIT) in number
    res.status(200).json({
      data: posts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / LIMIT),
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPostsBySearch = async (req, res) => {
  // this fucntion will get all the posts from the database based on the search query and tags
  const { searchQuery, tags } = req.query;
  try {
    const title = new RegExp(searchQuery, "i"); // we are converting the searhQuery passed as a string from frontend to backend beacuse that will help mongodb database to search the query in a case insensitive way
    const tagsArray = tags ? tags?.split(",") : [];
    const posts = await PostMessage.find({
      $or: [{ title }, { tags: { $in: tagsArray } }],
    });
    // this will return all the posts that have the title or tags that matches the search query in the database
    res.json({ data: posts });
  } catch (error) {
    console.log(error.message);
  }
};

export const getPost = async (req, res) => {
  // this function will get a single post from the database based on the id
  const { id } = req.params;

  try {
    const post = await PostMessage.findById(id); // find the post by id

    res.status(200).json(post); // return the post
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  // this function will create a post and save it to the database
  const post = req.body;
  const newPostMessage = new PostMessage({
    ...post,
    creator: req.userId,
    createdAt: new Date().toISOString(),
  });

  try {
    await newPostMessage.save();
    res.status(201).json(newPostMessage); // return the newly created post
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, message, creator, selectedFile, tags } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const updatedPost = { creator, title, message, tags, selectedFile, _id: id };

  await PostMessage.findByIdAndUpdate(id, updatedPost, { new: true });

  res.json(updatedPost);
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  await PostMessage.findByIdAndRemove(id);

  res.json({ message: "Post deleted successfully." });
};

export const likePost = async (req, res) => {
  const { id } = req.params;

  if (!req.userId) return res.json({ message: "Unauthenticated" });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const post = await PostMessage.findById(id);

  const index = post?.likes?.findIndex((id) => id === String(req.userId));

  if (index === -1) {
    post.likes.push(req.userId);
  } else {
    post.likes = post?.likes?.filter((id) => id !== String(req.userId));
  }

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {
    new: true,
  });

  res.json(updatedPost);
};

export const commentPost = async (req, res) => {
  console.log("inside controller");
  const { id } = req.params;
  const { value } = req.body;

  const post = await PostMessage.findById(id);
  post?.comments?.push(value);

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {
    new: true,
  });
  res.json(updatedPost);
};

export default router;
