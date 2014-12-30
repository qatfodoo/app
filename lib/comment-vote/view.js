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
var citizen = require('citizen');

/**
 * Configure markdown
 */
function CommentVote(comment) {
  if (!(this instanceof CommentVote)) {
    return new CommentVote(comment);
  }

  View.call(this, template);
  this.count = 0;
  this.comment = comment;
  this.likeButton = this.find('.vote.like');

  this.dislikeButton = this.find('.vote.dislike');
  this.scoreCounter = this.find('.counter');

  this.calculateVotes(comment);
}

View(CommentVote);

/**
 * Turn on event bindings
 * called when inserted to DOM
 */
CommentVote.prototype.switchOn = function () {
  this.bind('click', '.like', 'onUpVote');
  this.bind('click', '.dislike', 'onDownVote');
};

/**
 * Turn off event bindings
 * called when removed from DOM
 */
CommentVote.prototype.switchOff = function () {
  this.unbind('click', '.like', 'onUpVote');
  this.unbind('click', '.dislike', 'onDownVote');
};

CommentVote.prototype.validateVote = function () {
  if (this.comment.author.id === citizen.id) {
    this.onError(t('You\'re not allowed to vote your own argument'));
    return false;
  } else if (!citizen.id) {
    this.onError(t('comments.sign-in-required-to-vote-comments'));
    return false;
  }
  this.removePreviousErrors();
  return true;
};

CommentVote.prototype.onUpVote = function (ev) {
  ev.preventDefault();
  if (this.validateVote()) {
    this.likeButton.addClass('selected');
    this.dislikeButton.removeClass('selected');
    this.upVote();
    this.updateVote('upvote', this.likeButton);
  }
};

CommentVote.prototype.onDownVote = function (ev) {
  ev.preventDefault();
  if (this.validateVote()) {
    this.dislikeButton.addClass('selected');
    this.likeButton.removeClass('selected');
    this.downVote();
    this.updateVote('downvote', this.dislikeButton);
  }
};

CommentVote.prototype.onError = function (message) {
  this.emit('CommentVote:error', message);
};

CommentVote.prototype.removePreviousErrors = function () {
  this.emit('CommentVote:error-clean');
};

CommentVote.prototype.calculateVotes = function (comment) {
  this.count = comment.upvotes.length - comment.downvotes.length;
  this.scoreCounter.text(this.count);
};

CommentVote.prototype.downVote = function () {
  this.count -= 1;
  this.scoreCounter.text(this.count);
};

CommentVote.prototype.upVote = function () {
  this.count += 1;
  this.scoreCounter.text(this.count);
};

/**
 * Call the api to update the vote comment .
 *
 * @param url
 * @param button
 */
CommentVote.prototype.updateVote = function (url, button) {
  var self = this;
  request
      .post(this.url() + '/' + url)
      .end(function (err, res) {

        if (err || !res) {
          log('Fetch error: %s', err);
          return button.removeClass('selected');
        }

        if (res.status == 401) {
          self.onError(t(res.body.error));
          return;
        }

        if (!res.ok) {
          log('Fetch error: %s', res.error);
          return button.removeClass('selected');
        }

        if (res.body && res.body.error) {
          log('Fetch response error: %s', res.body.error);
          return button.removeClass('selected');
        }

        log('successfull %s %s',url, self.comment.id);
      });
};

CommentVote.prototype.url = function () {
  return '/api/comment/:id'.replace(':id', this.comment.id);
};

/**
 * Expose comments view
 */
module.exports = CommentVote;