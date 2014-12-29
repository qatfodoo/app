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
  this.bind('click', '.like', 'onLike');
  this.bind('click', '.dislike', 'onDislike');
};

/**
 * Turn off event bindings
 * called when removed from DOM
 */
CommentVote.prototype.switchOff = function () {
  this.unbind('click', '.like', 'onLike');
  this.unbind('click', '.dislike', 'onDislike');
};

/**
 * Action like comment
 */
CommentVote.prototype.onLike = function (ev) {
  ev.preventDefault();

  var comment = this.comment;
  var liked   = this.locals.likes;
  var disliked = this.locals.dislikes;

  if (comment.author.id === citizen.id) {
    this.onError(t('You\'re not allowed to vote your own argument'));
    return;
  }
  if (!citizen.id) {
    this.onError(t('comments.sign-in-required-to-vote-comments'));
    return;
  }
  this.removePreviousErrors();

  this.likeButton.addClass('selected');
  this.dislikeButton.removeClass('selected');

  var count = parseInt(this.scoreCounter.html(), 10) || 0;
  count += disliked ? 2 : (liked ? 0 : 1);
  this.scoreCounter.html(count);

  this.locals.likes = true;
  this.locals.dislikes = false;
  this.updateVote('upvote', this.likeButton);
};

/**
 * Action dislike comment
 */
CommentVote.prototype.onDislike = function (ev) {
  ev.preventDefault();

  var comment = this.comment;
  var liked = this.locals.likes;
  var disliked = this.locals.dislikes;

  if (comment.author.id === citizen.id) {
    this.onError(t('You\'re not allowed to vote your own argument'));
    return;
  }
  if (!citizen.id) {
    this.onError(t('comments.sign-in-required-to-vote-comments'));
    return;
  }
  this.removePreviousErrors();

  this.dislikeButton.addClass('selected');
  this.likeButton.removeClass('selected');

  this.count = parseInt(this.scoreCounter.html(), 10) || 0;
  this.count -= liked ? 2 : (disliked ? 0 : 1);
  this.scoreCounter.html(this.count);

  this.locals.dislikes = true;
  this.locals.likes = false;
  this.updateVote('downvote', this.dislikeButton);
};

/**
 * Call the api to update the vote comment .
 *
 * @param url
 * @param button
 * @param error
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

CommentVote.prototype.onError = function (message) {
  this.emit('CommentVote:error', message);
};

CommentVote.prototype.removePreviousErrors = function () {
  this.emit('CommentVote:error-clean');
};

/**
 * Calculate votes at initialize view.
 * @param comment
 */
CommentVote.prototype.calculateVotes = function (comment) {
  this.count = comment.upvotes.length - comment.downvotes.length;
  this.scoreCounter.text(this.count);
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

CommentVote.prototype.url = function () {
  return '/api/comment/:id'.replace(':id', this.comment.id);
};

/**
 * Expose comments view
 */
module.exports = CommentVote;