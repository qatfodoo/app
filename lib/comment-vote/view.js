/**
 * Module dependencies.
 */
var template = require('./template');
var request = require('request');
var Emitter = require('emitter');
var events = require('events');
var t = require('t');
var dom = require('dom');
var log = require('debug')('democracyos:comment-vote');
var View = require('view');


/**
 * Configure markdown
 */
function CommentVote(comment) {
  if (!(this instanceof CommentVote)) {
    return new CommentVote(comment);
  }

  View.call(this, template);
  this.count = 0;
  this.calculateVotes(comment);
}

View(CommentVote);

/**
 * Calculate votes at initialize view.
 * @param comment
 */
CommentVote.prototype.calculateVotes = function (comment) {
  this.count = comment.upvotes.length - comment.downvotes.length;
};

CommentVote.prototype.downVote = function () {
  this.count -= 1;
};

CommentVote.prototype.upVote = function () {
  this.count += 1;
};

CommentVote.prototype.onUpVote = function () {
  this.upVote();
  this.updateVoting();
};

CommentVote.prototype.onDownVote = function () {
  this.downVote();
  this.updateVoting();
};

CommentVote.prototype.updateVoting = function () {
  //here come the request (I guess)
};

/**
 * Expose comments view
 */
module.exports = CommentVote;