/* ============================================================
   CARLO BLOG — Complete Social Platform
   ============================================================ */
'use strict';

/* ── Config ──────────────────────────────────────────────── */
var API = 'https://carlo-portfolio-api.johncarloebora.workers.dev';
var AUTHOR_DEFAULT = 'Carlo';
var AUTHOR_AVATAR  = '../profile/Carlo.jpg';

/* ── State ───────────────────────────────────────────────── */
var _state = {
  route:      '/',
  posts:      [],
  page:       1,
  total:      0,
  loading:    false,
  loadingMore:false,
  noMore:     false,
  tagFilter:  '',
  searchQuery:'',
  reacted:    {},  /* postId → reaction type (session only) */
  isAdmin:    false,
  editingPost:null,
  pendingMedia:[],   /* { file, url, type, uploaded } */
  uploadAbort: null,
};

/* ── Helpers ─────────────────────────────────────────────── */
function esc(s) {
  var d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

function relTime(ts) {
  var diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800)return Math.floor(diff/86400) + 'd ago';
  return new Date(ts).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

function toast(msg, type) {
  type = type || 'info';
  var el = document.createElement('div');
  el.className = 'bl-toast ' + type;
  var icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  el.innerHTML = '<i class="fas ' + icon + '"></i><span>' + esc(msg) + '</span>';
  var container = document.getElementById('toastContainer');
  if (container) {
    container.appendChild(el);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
  }
}

function authHeaders() {
  var token = localStorage.getItem('admin_jwt') || sessionStorage.getItem('admin_jwt') || '';
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function checkAdmin() {
  var token = localStorage.getItem('admin_jwt') || sessionStorage.getItem('admin_jwt') || '';
  _state.isAdmin = !!token;
  var composeBtn = document.getElementById('composeBtn');
  var adminLink  = document.getElementById('adminLink');
  if (composeBtn) composeBtn.style.display = _state.isAdmin ? '' : 'none';
  if (adminLink)  adminLink.style.display  = _state.isAdmin ? '' : 'none';
  var replyBars = document.querySelectorAll('#replyBar');
  replyBars.forEach(function(el) { el.style.display = _state.isAdmin ? '' : 'none'; });
}

/* ── API Calls ───────────────────────────────────────────── */
function apiFetch(path, options) {
  options = options || {};
  var headers = Object.assign({}, options.headers || {});
  var authH = authHeaders();
  Object.assign(headers, authH);
  return fetch(API + path, Object.assign({}, options, { headers: headers }))
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Request failed'); });
      return r.json();
    });
}

function fetchFeed(page, tag, search) {
  var q = '?page=' + page + '&limit=10';
  if (tag)    q += '&tag='    + encodeURIComponent(tag);
  if (search) q += '&search=' + encodeURIComponent(search);
  return apiFetch('/api/blog/feed' + q);
}

function fetchThread(id) {
  return apiFetch('/api/blog/posts/' + id + '/thread');
}

function fetchTags() {
  return apiFetch('/api/blog/tags');
}

function fetchUserPosts(author, page) {
  return apiFetch('/api/blog/user/' + encodeURIComponent(author) + '?page=' + (page || 1) + '&limit=10');
}

function fetchTagPosts(tag, page) {
  return fetchFeed(page || 1, tag, '');
}

function reactToPost(id, reaction, remove) {
  return apiFetch('/api/blog/posts/' + id + '/react', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction: reaction, remove: !!remove }),
  });
}

function postReply(parentId, content) {
  return apiFetch('/api/blog/posts', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
    body: JSON.stringify({ content: content, reply_to: parentId }),
  });
}

function createPost(data) {
  return apiFetch('/api/blog/posts', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
    body: JSON.stringify(data),
  });
}

function updatePost(id, data) {
  return apiFetch('/api/blog/posts/' + id, {
    method: 'PUT',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
    body: JSON.stringify(data),
  });
}

function deletePost(id) {
  return apiFetch('/api/blog/posts/' + id, { method: 'DELETE', headers: authHeaders() });
}

function pinPost(id, pinned) {
  return apiFetch('/api/blog/posts/' + id + '/pin', {
    method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
    body: JSON.stringify({ pinned: pinned }),
  });
}

function featurePost(id, featured) {
  return apiFetch('/api/blog/posts/' + id + '/feature', {
    method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
    body: JSON.stringify({ featured: featured }),
  });
}

/* ── Media Upload ────────────────────────────────────────── */
function compressImage(file, maxW, maxH, quality) {
  maxW = maxW || 1400; maxH = maxH || 1400; quality = quality || 0.82;
  return new Promise(function(resolve) {
    if (file.type === 'image/gif' || file.type.startsWith('video/')) { resolve(file); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w <= maxW && h <= maxH) { resolve(file); return; }
        var ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob) {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type, quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function uploadBlogMedia(file, onProgress) {
  return new Promise(function(resolve, reject) {
    compressImage(file).then(function(compressed) {
      var fd = new FormData();
      fd.append('file', compressed);

      var xhr = new XMLHttpRequest();
      _state.uploadAbort = function() { xhr.abort(); };

      xhr.open('POST', API + '/api/blog/media/upload');
      var token = localStorage.getItem('admin_jwt') || sessionStorage.getItem('admin_jwt') || '';
      if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);

      if (onProgress) {
        xhr.upload.addEventListener('progress', function(e) {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        });
      }
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
          catch(e) { reject(new Error('Upload failed')); }
        }
      };
      xhr.onerror = function() { reject(new Error('Network error during upload')); };
      xhr.onabort = function() { reject(new Error('Upload cancelled')); };
      xhr.send(fd);
    });
  });
}

/* ── Rendering: Post Card ────────────────────────────────── */
function renderHashtags(text) {
  return esc(text).replace(/#(\w+)/g, function(_, tag) {
    return '<span class="bl-hashtag" onclick="navigate(\'/tag/' + tag + '\')">#' + esc(tag) + '</span>';
  });
}

function renderMediaGrid(media) {
  if (!media || !media.length) return '';
  var count = Math.min(media.length, 4);
  var extra = media.length > 4 ? media.length - 3 : 0;
  var cls = 'bl-media-grid count-' + (media.length > 4 ? 'many' : count);
  var items = '';
  for (var i = 0; i < (extra ? 3 : count); i++) {
    var m = media[i];
    var isVideo = m.type === 'video' || (m.url && /\.(mp4|webm|mov)$/i.test(m.url));
    var thumb = isVideo
      ? '<video src="' + esc(m.url) + '" preload="metadata" muted playsinline style="pointer-events:none"></video><div class="bl-video-indicator"><i class="fas fa-play"></i></div>'
      : '<img src="' + esc(m.url) + '" alt="" loading="lazy">';
    items += '<div class="bl-media-item" data-media-idx="' + i + '">'
      + thumb
      + '<div class="bl-media-overlay"><i class="fas fa-expand"></i></div>'
      + '</div>';
  }
  if (extra) {
    var m3 = media[3];
    var isV = m3.type === 'video' || (m3.url && /\.(mp4|webm|mov)$/i.test(m3.url));
    var t3 = isV ? '<video src="' + esc(m3.url) + '" preload="none" muted></video>' : '<img src="' + esc(m3.url) + '" alt="" loading="lazy">';
    items += '<div class="bl-media-item" data-media-idx="3">'
      + t3
      + '<div class="bl-media-more-badge">+' + extra + '</div>'
      + '</div>';
  }
  return '<div class="' + cls + '" data-media="' + esc(JSON.stringify(media.map(function(m){return m.url;}))) + '">' + items + '</div>';
}

function buildPostCard(post, opts) {
  opts = opts || {};
  var isAdmin   = _state.isAdmin;
  var isReply   = !!post.reply_to;
  var myReact   = _state.reacted[post.id] || '';
  var reactions = post.reactions || {};
  var media     = post.media || [];
  var tags      = [...new Set([...(post.tags||[]), ...(post.hashtags||[])])];
  var text      = post.content || '';
  var isLong    = text.length > 400;

  /* Pinned / featured badges */
  var badges = '';
  if (post.pinned)   badges += '<span class="bl-badge bl-badge-pin"><i class="fas fa-thumbtack"></i> Pinned</span>';
  if (post.featured) badges += '<span class="bl-badge bl-badge-feat"><i class="fas fa-star"></i> Featured</span>';

  /* Admin dropdown */
  var menuHtml = '';
  if (isAdmin) {
    menuHtml = '<div class="bl-card-menu">'
      + '<button class="bl-card-menu-btn" onclick="toggleCardMenu(event,' + post.id + ')"><i class="fas fa-ellipsis-h"></i></button>'
      + '<div class="bl-card-dropdown" id="menu' + post.id + '" style="display:none">'
      + '<button class="bl-card-dropdown-item" onclick="editPost(' + post.id + ')"><i class="fas fa-pencil-alt"></i> Edit</button>'
      + '<button class="bl-card-dropdown-item" onclick="togglePin(' + post.id + ',' + (post.pinned?0:1) + ')"><i class="fas fa-thumbtack"></i> ' + (post.pinned?'Unpin':'Pin') + '</button>'
      + '<button class="bl-card-dropdown-item" onclick="toggleFeature(' + post.id + ',' + (post.featured?0:1) + ')"><i class="fas fa-star"></i> ' + (post.featured?'Unfeature':'Feature') + '</button>'
      + '<button class="bl-card-dropdown-item danger" onclick="confirmDeletePost(' + post.id + ')"><i class="fas fa-trash-alt"></i> Delete</button>'
      + '</div></div>';
  }

  /* Reply-to indicator */
  var replyToHtml = '';
  if (isReply && opts.showReplyTo) {
    replyToHtml = '<div class="bl-reply-to"><i class="fas fa-reply"></i> Replying to a post</div>';
  }

  /* Reactions */
  var reactionEmoji = { like:'👍', love:'❤️', fire:'🔥', clap:'👏' };
  var reactHtml = '';
  Object.keys(reactionEmoji).forEach(function(r) {
    var cnt = reactions[r] || 0;
    var isActive = myReact === r;
    reactHtml += '<button class="bl-action-btn ' + (isActive ? 'reacted' : '') + '" '
      + 'onclick="doReact(' + post.id + ',\'' + r + '\')" title="' + r + '">'
      + reactionEmoji[r]
      + (cnt > 0 ? ' <span>' + cnt + '</span>' : '')
      + '</button>';
  });

  /* Text rendering */
  var textHtml = renderHashtags(text);
  var truncClass = isLong && !opts.full ? ' truncated' : '';
  var readMore = isLong && !opts.full
    ? '<span class="bl-read-more" onclick="openThread(' + post.id + ')">Read more</span>' : '';

  /* Location */
  var locHtml = post.location
    ? ' · <span class="bl-card-location"><i class="fas fa-map-marker-alt"></i> ' + esc(post.location) + '</span>' : '';

  return '<div class="bl-card' + (post.pinned ? ' bl-pinned' : '') + (post.featured ? ' bl-featured-card' : '') + '" data-post-id="' + post.id + '">'
    + replyToHtml
    + '<div class="bl-card-hd">'
    +   '<img class="bl-card-avatar" src="' + esc(post.author_avatar || AUTHOR_AVATAR) + '" alt="' + esc(post.author) + '"'
    +   ' onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author) + '&background=4ecdc4&color=0d0d0d&size=44&bold=true\'"'
    +   ' onclick="navigate(\'/user/' + encodeURIComponent(post.author) + '\')">'
    +   '<div class="bl-card-meta">'
    +     '<div><span class="bl-card-author" onclick="navigate(\'/user/' + encodeURIComponent(post.author) + '\')">' + esc(post.author) + '</span>'
    +     '<span class="bl-card-badges">' + badges + '</span></div>'
    +     '<div class="bl-card-time">' + relTime(post.created_at) + locHtml + '</div>'
    +   '</div>'
    +   menuHtml
    + '</div>'
    + '<div class="bl-card-body">'
    +   '<div class="bl-card-text' + truncClass + '">' + textHtml + '</div>'
    +   readMore
    +   renderMediaGrid(media)
    + '</div>'
    + (tags.length ? '<div class="bl-card-tags">' + tags.map(function(t) {
        return '<span class="bl-tag-pill" onclick="navigate(\'/tag/' + esc(t) + '\')">#' + esc(t) + '</span>';
      }).join('') + '</div>' : '')
    + '<div class="bl-card-actions">'
    +   reactHtml
    +   '<button class="bl-action-btn bl-action-thread" onclick="openThread(' + post.id + ')">'
    +   '<i class="fas fa-comment-alt"></i> '
    +   (post.reply_count > 0 ? post.reply_count + ' ' : '') + 'Reply'
    +   '</button>'
    + '</div>'
    + '</div>';
}

/* ── Rendering: Feed ─────────────────────────────────────── */
function renderFeed(posts, append) {
  var container = document.getElementById('pageContent');
  if (!container) return;

  if (!append) {
    /* Remove skeleton */
    var skel = document.getElementById('initialSkeleton');
    if (skel) skel.style.display = 'none';

    if (!posts.length) {
      container.innerHTML = '<div class="bl-empty">'
        + '<div class="bl-empty-icon"><i class="fas fa-feather-alt"></i></div>'
        + '<div class="bl-empty-title">No posts yet</div>'
        + '<div class="bl-empty-sub">Check back soon for new content.</div>'
        + '</div>';
      return;
    }
    container.innerHTML = '';
  }

  var frag = document.createDocumentFragment();
  var wrapper = document.createElement('div');
  wrapper.innerHTML = posts.map(function(p) { return buildPostCard(p); }).join('');
  while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
  container.appendChild(frag);

  /* Bind media click events */
  bindMediaGrids(container);
}

function bindMediaGrids(root) {
  (root || document).querySelectorAll('.bl-media-grid').forEach(function(grid) {
    if (grid.dataset.bound) return;
    grid.dataset.bound = '1';
    var urls;
    try { urls = JSON.parse(grid.dataset.media || '[]'); } catch(e) { urls = []; }
    grid.querySelectorAll('.bl-media-item').forEach(function(item) {
      item.addEventListener('click', function() {
        openLightbox(urls, parseInt(item.dataset.mediaIdx) || 0);
      });
    });
  });
}

/* ── Feed loading ────────────────────────────────────────── */
function loadFeed(reset) {
  if (_state.loading || _state.loadingMore) return;
  if (reset) {
    _state.posts = []; _state.page = 1; _state.noMore = false;
    var skel = document.getElementById('initialSkeleton');
    if (skel) skel.style.display = '';
    var pc = document.getElementById('pageContent');
    if (pc) { pc.innerHTML = ''; if (skel) pc.appendChild(skel); }
    document.getElementById('endMarker') && (document.getElementById('endMarker').style.display = 'none');
  }
  if (_state.noMore) return;

  var isFirst = _state.page === 1;
  if (isFirst) _state.loading = true;
  else { _state.loadingMore = true; document.getElementById('loadingSpinner') && (document.getElementById('loadingSpinner').style.display = ''); }

  fetchFeed(_state.page, _state.tagFilter, _state.searchQuery)
    .then(function(data) {
      _state.loading = false; _state.loadingMore = false;
      document.getElementById('loadingSpinner') && (document.getElementById('loadingSpinner').style.display = 'none');

      var newPosts = data.posts || [];
      _state.posts = isFirst ? newPosts : _state.posts.concat(newPosts);
      _state.total = data.total;

      renderFeed(newPosts, !isFirst);

      /* Load featured posts on first load */
      if (isFirst) loadFeatured();

      if (_state.posts.length >= _state.total || newPosts.length < 10) {
        _state.noMore = true;
        document.getElementById('endMarker') && (_state.posts.length > 0) && (document.getElementById('endMarker').style.display = '');
      }
      _state.page++;
    })
    .catch(function(err) {
      _state.loading = false; _state.loadingMore = false;
      document.getElementById('loadingSpinner') && (document.getElementById('loadingSpinner').style.display = 'none');
      var skel = document.getElementById('initialSkeleton');
      if (skel) skel.style.display = 'none';
      var pc = document.getElementById('pageContent');
      if (pc && !_state.posts.length) pc.innerHTML = '<div class="bl-empty"><div class="bl-empty-icon"><i class="fas fa-wifi"></i></div><div class="bl-empty-title">Couldn\'t load posts</div><div class="bl-empty-sub">' + esc(err.message) + '</div></div>';
    });
}

function loadFeatured() {
  apiFetch('/api/blog/feed?page=1&limit=20').then(function(data) {
    var featured = (data.posts || []).filter(function(p) { return p.featured; });
    if (!featured.length) return;
    var widget = document.getElementById('featuredWidget');
    var list   = document.getElementById('featuredList');
    if (!widget || !list) return;
    widget.style.display = '';
    list.innerHTML = featured.slice(0, 5).map(function(p) {
      return '<div class="bl-featured-item" onclick="openThread(' + p.id + ')">'
        + '<div class="bl-featured-text">' + esc((p.content || '').slice(0, 90)) + '</div>'
        + '<div class="bl-featured-time">' + relTime(p.created_at) + '</div>'
        + '</div>';
    }).join('');
  }).catch(function(){});
}

/* ── Infinite scroll ─────────────────────────────────────── */
var _scrollObserver = null;
function initInfiniteScroll() {
  if (_scrollObserver) _scrollObserver.disconnect();
  _scrollObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !_state.noMore && !_state.loading && !_state.loadingMore) {
      loadFeed(false);
    }
  }, { rootMargin: '0px 0px 300px 0px' });
  var sentinel = document.getElementById('scrollSentinel');
  if (sentinel) _scrollObserver.observe(sentinel);
}

/* ── Tags sidebar ────────────────────────────────────────── */
function loadTags() {
  fetchTags().then(function(data) {
    var tags = (data.tags || []).slice(0, 20);
    var cloud = document.getElementById('tagCloud');
    if (!cloud) return;
    if (!tags.length) { cloud.innerHTML = '<span style="color:var(--bl-muted);font-size:.82rem">No tags yet</span>'; return; }
    cloud.innerHTML = tags.map(function(t) {
      return '<a href="#/tag/' + encodeURIComponent(t.tag) + '" class="bl-tag-cloud-pill">'
        + '#' + esc(t.tag)
        + '<span class="bl-count">' + t.count + '</span>'
        + '</a>';
    }).join('');
    document.getElementById('statTags') && (document.getElementById('statTags').textContent = data.tags.length);
  }).catch(function(){});
}

function loadProfileStats() {
  fetchUserPosts(AUTHOR_DEFAULT, 1).then(function(data) {
    document.getElementById('statPosts')   && (document.getElementById('statPosts').textContent   = data.stats.posts || 0);
    document.getElementById('statReplies') && (document.getElementById('statReplies').textContent = data.stats.replies || 0);
  }).catch(function(){});
}

/* ── Thread / Post Modal ─────────────────────────────────── */
function openThread(id) {
  var modal     = document.getElementById('postModal');
  var modalBody = document.getElementById('postModalBody');
  var replyBar  = document.getElementById('replyBar');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = '<div style="text-align:center;padding:40px"><span class="bl-spinner"></span></div>';
  modal.style.display = '';
  document.body.style.overflow = 'hidden';

  if (replyBar) replyBar.style.display = _state.isAdmin ? '' : 'none';

  /* Update URL hash without re-routing */
  history.pushState(null, '', '#/post/' + id);

  fetchThread(id).then(function(data) {
    var post    = data.post;
    var replies = data.replies || [];
    var html    = buildPostCard(post, { full: true });

    if (replies.length) {
      html += '<div class="bl-thread-replies">';
      html += '<div style="font-size:.78rem;color:var(--bl-muted);margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">'
            + replies.length + ' ' + (replies.length === 1 ? 'Reply' : 'Replies') + '</div>';
      replies.forEach(function(r) {
        html += '<div class="bl-reply">'
          + '<img class="bl-reply-av" src="' + esc(r.author_avatar || AUTHOR_AVATAR) + '" alt="' + esc(r.author) + '"'
          + ' onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.author) + '&background=4ecdc4&color=0d0d0d&size=36\'">'
          + '<div class="bl-reply-body">'
          +   '<div class="bl-reply-author">' + esc(r.author) + '</div>'
          +   '<div class="bl-reply-text">' + renderHashtags(r.content) + '</div>'
          +   renderMediaGrid(r.media || [])
          +   '<div class="bl-reply-time">' + relTime(r.created_at) + '</div>'
          + '</div></div>';
      });
      html += '</div>';
    } else {
      html += '<div style="text-align:center;padding:20px 0;color:var(--bl-muted);font-size:.85rem">No replies yet. Be the first to reply!</div>';
    }

    modalBody.innerHTML = html;
    bindMediaGrids(modalBody);

    /* Store parent id for reply */
    var replySubmit = document.getElementById('replySubmit');
    if (replySubmit) {
      replySubmit.dataset.parentId = id;
      replySubmit.onclick = function() { submitReply(id); };
    }
  }).catch(function(err) {
    modalBody.innerHTML = '<div class="bl-empty"><div class="bl-empty-icon"><i class="fas fa-exclamation-triangle"></i></div>'
      + '<div class="bl-empty-title">Could not load post</div>'
      + '<div class="bl-empty-sub">' + esc(err.message) + '</div></div>';
  });
}

function closeThreadModal() {
  var modal = document.getElementById('postModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  /* Restore hash to previous route */
  history.replaceState(null, '', '#' + _state.route);
}

function submitReply(parentId) {
  var ta = document.getElementById('replyText');
  if (!ta) return;
  var text = ta.value.trim();
  if (!text) { toast('Reply cannot be empty', 'error'); return; }
  var btn = document.getElementById('replySubmit');
  if (btn) { btn.disabled = true; btn.textContent = 'Posting…'; }

  postReply(parentId, text)
    .then(function() {
      ta.value = '';
      toast('Reply posted!', 'success');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-reply"></i> Reply'; }
      openThread(parentId);
    })
    .catch(function(err) {
      toast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-reply"></i> Reply'; }
    });
}

/* ── Reactions ───────────────────────────────────────────── */
window.doReact = function(id, reaction) {
  var post = _state.posts.find(function(p) { return p.id === id; });
  if (!post) return;

  var previous = _state.reacted[id] || '';
  var isUndo   = previous === reaction;

  /* Optimistic update */
  var reactions = Object.assign({}, post.reactions || {});
  if (isUndo) {
    reactions[reaction] = Math.max(0, (reactions[reaction] || 0) - 1);
    _state.reacted[id] = '';
  } else {
    if (previous) reactions[previous] = Math.max(0, (reactions[previous] || 0) - 1);
    reactions[reaction] = (reactions[reaction] || 0) + 1;
    _state.reacted[id] = reaction;
  }

  /* Update DOM optimistically */
  var card = document.querySelector('[data-post-id="' + id + '"]');
  if (card) {
    var tmpPost = Object.assign({}, post, { reactions: reactions });
    var newCard = document.createElement('div');
    newCard.innerHTML = buildPostCard(tmpPost);
    var newInner = newCard.firstChild;
    if (newInner) card.parentNode.replaceChild(newInner, card);
    bindMediaGrids(newInner);
  }

  reactToPost(id, reaction, isUndo)
    .then(function(data) {
      /* Update state with server values */
      post.reactions = data.reactions;
    })
    .catch(function() {
      /* Rollback */
      _state.reacted[id] = previous;
      toast('Reaction failed', 'error');
    });
};

/* ── Admin Post Actions ──────────────────────────────────── */
window.toggleCardMenu = function(evt, id) {
  evt.stopPropagation();
  var menu = document.getElementById('menu' + id);
  if (!menu) return;
  /* Close all other menus */
  document.querySelectorAll('.bl-card-dropdown').forEach(function(m) {
    if (m !== menu) m.style.display = 'none';
  });
  menu.style.display = menu.style.display === 'none' ? '' : 'none';
};

document.addEventListener('click', function() {
  document.querySelectorAll('.bl-card-dropdown').forEach(function(m) { m.style.display = 'none'; });
});

window.togglePin = function(id, val) {
  pinPost(id, val).then(function() {
    toast(val ? 'Post pinned' : 'Post unpinned', 'success');
    loadFeed(true);
  }).catch(function(e) { toast(e.message, 'error'); });
};

window.toggleFeature = function(id, val) {
  featurePost(id, val).then(function() {
    toast(val ? 'Post featured' : 'Post unfeatured', 'success');
    loadFeed(true);
  }).catch(function(e) { toast(e.message, 'error'); });
};

window.confirmDeletePost = function(id) {
  if (!confirm('Delete this post and all its replies? This cannot be undone.')) return;
  deletePost(id).then(function() {
    toast('Post deleted', 'success');
    /* Remove from DOM instantly */
    var card = document.querySelector('[data-post-id="' + id + '"]');
    if (card) card.remove();
    _state.posts = _state.posts.filter(function(p) { return p.id !== id; });
  }).catch(function(e) { toast(e.message, 'error'); });
};

window.editPost = function(id) {
  var post = _state.posts.find(function(p) { return p.id === id; }) || null;
  openComposeModal(post);
};

window.openThread = openThread;

/* ── Compose Modal ───────────────────────────────────────── */
function openComposeModal(editPost) {
  _state.editingPost  = editPost || null;
  _state.pendingMedia = [];

  var modal = document.getElementById('composeModal');
  var ta    = document.getElementById('composeText');
  var grid  = document.getElementById('composeMediaGrid');
  var loc   = document.getElementById('composeLocation');
  var title = document.getElementById('composeTitle');
  if (!modal) return;

  if (editPost) {
    title.textContent = 'Edit Post';
    ta.value = editPost.content || '';
    loc.value = editPost.location || '';
    /* Pre-populate media */
    _state.pendingMedia = (editPost.media || []).map(function(m) {
      return { url: m.url, type: m.type || 'image', uploaded: true, serverMedia: m };
    });
  } else {
    title.textContent = 'New Post';
    ta.value = ''; loc.value = '';
    _state.pendingMedia = [];
  }

  renderComposeMediaGrid();
  updateComposeChar();
  updateComposeTags();
  modal.style.display = '';
  document.body.style.overflow = 'hidden';
  setTimeout(function() { ta.focus(); }, 50);
}

function closeComposeModal() {
  var modal = document.getElementById('composeModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  _state.editingPost   = null;
  _state.pendingMedia  = [];
  _state.uploadAbort   = null;
}

function updateComposeChar() {
  var ta  = document.getElementById('composeText');
  var cnt = document.getElementById('composeCharCount');
  if (ta && cnt) cnt.textContent = (ta.value || '').length;
}

function updateComposeTags() {
  var ta      = document.getElementById('composeText');
  var preview = document.getElementById('composeTagPreview');
  var list    = document.getElementById('composeTagList');
  if (!ta || !preview || !list) return;
  var tags = (ta.value.match(/#(\w+)/g) || []).map(function(h) { return h.slice(1); });
  var unique = tags.filter(function(t, i, a) { return a.indexOf(t) === i; });
  if (unique.length) {
    preview.style.display = '';
    list.innerHTML = unique.map(function(t) {
      return '<span class="bl-tag-pill">#' + esc(t) + '</span>';
    }).join(' ');
  } else {
    preview.style.display = 'none';
  }
}

function renderComposeMediaGrid() {
  var grid = document.getElementById('composeMediaGrid');
  if (!grid) return;
  if (!_state.pendingMedia.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = _state.pendingMedia.map(function(m, i) {
    var isVideo = m.type === 'video' || (m.url && /\.(mp4|webm|mov)$/i.test(m.url));
    var thumb   = isVideo
      ? '<video src="' + esc(m.url) + '" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>'
      : '<img src="' + esc(m.url) + '" style="width:100%;height:100%;object-fit:cover" alt="">';
    return '<div class="bl-compose-thumb">'
      + thumb
      + '<button class="bl-compose-thumb-del" onclick="removeComposeMedia(' + i + ')"><i class="fas fa-times"></i></button>'
      + '</div>';
  }).join('');
}

window.removeComposeMedia = function(idx) {
  _state.pendingMedia.splice(idx, 1);
  renderComposeMediaGrid();
};

function handleFileSelect(files, type) {
  if (!_state.isAdmin) { toast('Log in to the admin panel first', 'error'); return; }
  var arr = Array.from(files);
  if (!arr.length) return;

  /* Limit: 4 images, 1 video, 1 gif */
  if (type === 'image') arr = arr.slice(0, Math.max(0, 4 - _state.pendingMedia.filter(function(m){return m.type!=='video';}).length));
  else arr = arr.slice(0, 1);

  /* Show local preview immediately */
  arr.forEach(function(file) {
    var localUrl = URL.createObjectURL(file);
    _state.pendingMedia.push({ file: file, url: localUrl, type: type, uploaded: false });
  });
  renderComposeMediaGrid();

  /* Upload each file */
  uploadPendingMedia();
}

function uploadPendingMedia() {
  var toUpload = _state.pendingMedia.filter(function(m) { return !m.uploaded && m.file; });
  if (!toUpload.length) return;

  var uploadRow = document.getElementById('uploadRow');
  var uploadBar = document.getElementById('uploadBar');
  var uploadLabel = document.getElementById('uploadLabel');
  if (uploadRow) uploadRow.style.display = '';

  var idx = 0;
  function next() {
    if (idx >= toUpload.length) {
      if (uploadRow) uploadRow.style.display = 'none';
      if (uploadBar) uploadBar.style.width = '0%';
      return;
    }
    var item = toUpload[idx];
    if (uploadLabel) uploadLabel.textContent = 'Uploading ' + (idx+1) + ' of ' + toUpload.length + '…';
    uploadBlogMedia(item.file, function(pct) {
      if (uploadBar) uploadBar.style.width = pct + '%';
    }).then(function(result) {
      /* Update pending media entry with server URL */
      var found = _state.pendingMedia.find(function(m) { return m.file === item.file; });
      if (found) { found.url = result.url; found.uploaded = true; found.serverUrl = result.url; delete found.file; }
      URL.revokeObjectURL(item.url);
      renderComposeMediaGrid();
      idx++;
      next();
    }).catch(function(err) {
      if (err.message !== 'Upload cancelled') toast('Upload failed: ' + err.message, 'error');
      if (uploadRow) uploadRow.style.display = 'none';
    });
  }
  next();
}

function submitCompose() {
  var ta  = document.getElementById('composeText');
  var loc = document.getElementById('composeLocation');
  if (!ta) return;

  var content = (ta.value || '').trim();
  if (!content) { toast('Post content is required', 'error'); return; }

  /* Check no uploads in progress */
  var stillUploading = _state.pendingMedia.some(function(m) { return !m.uploaded && m.file; });
  if (stillUploading) { toast('Please wait for uploads to finish', 'info'); return; }

  var media = _state.pendingMedia.map(function(m) {
    return { url: m.url || m.serverUrl, type: m.type };
  });
  var location = (loc ? loc.value : '').trim();
  var tags = (content.match(/#(\w+)/g) || []).map(function(h){ return h.slice(1); });

  var data = { content: content, location: location, media: media, tags: tags };

  var btn = document.getElementById('composeSubmit');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting…'; }

  var promise = _state.editingPost
    ? updatePost(_state.editingPost.id, data)
    : createPost(data);

  promise.then(function() {
    toast(_state.editingPost ? 'Post updated!' : 'Post published!', 'success');
    closeComposeModal();
    loadFeed(true);
  }).catch(function(err) {
    toast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish'; }
  });
}

/* ── Lightbox ────────────────────────────────────────────── */
var _lb = { urls: [], idx: 0 };

function openLightbox(urls, startIdx) {
  _lb.urls = urls || []; _lb.idx = startIdx || 0;
  var lb = document.getElementById('lightbox');
  if (!lb || !_lb.urls.length) return;
  lb.style.display = '';
  document.body.style.overflow = 'hidden';
  renderLightbox();
}

function renderLightbox() {
  var stage   = document.getElementById('lbStage');
  var counter = document.getElementById('lbCounter');
  var prev    = document.getElementById('lbPrev');
  var next    = document.getElementById('lbNext');
  if (!stage) return;
  var url = _lb.urls[_lb.idx];
  var isVideo = /\.(mp4|webm|mov)$/i.test(url);
  stage.innerHTML = isVideo
    ? '<video src="' + esc(url) + '" controls autoplay style="max-width:90vw;max-height:85vh;border-radius:8px"></video>'
    : '<img src="' + esc(url) + '" alt="" style="max-width:90vw;max-height:85vh;border-radius:8px">';
  if (counter) counter.textContent = (_lb.idx + 1) + ' / ' + _lb.urls.length;
  if (prev) prev.style.display = _lb.idx > 0 ? '' : 'none';
  if (next) next.style.display = _lb.idx < _lb.urls.length - 1 ? '' : 'none';
}

function closeLightbox() {
  var lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
}

/* ── Router ──────────────────────────────────────────────── */
function navigate(route) {
  history.pushState(null, '', '#' + route);
  handleRoute(route);
}

function handleRoute(route) {
  _state.route = route || '/';
  updateNavActive(route);

  /* Close modals */
  document.getElementById('postModal') && (document.getElementById('postModal').style.display = 'none');
  document.body.style.overflow = '';

  var pc = document.getElementById('pageContent');

  if (route === '/' || route === '/feed' || route === '') {
    _state.tagFilter = ''; _state.searchQuery = '';
    loadFeed(true);
    return;
  }

  var tagMatch = route.match(/^\/tag\/(.+)$/);
  if (tagMatch) {
    var tag = decodeURIComponent(tagMatch[1]);
    _state.tagFilter   = tag;
    _state.searchQuery = '';
    renderTagPageHeader(tag);
    loadFeed(true);
    return;
  }

  var userMatch = route.match(/^\/user\/(.+)$/);
  if (userMatch) {
    var author = decodeURIComponent(userMatch[1]);
    renderUserPage(author);
    return;
  }

  var postMatch = route.match(/^\/post\/(\d+)$/);
  if (postMatch) {
    /* Load feed in background then open thread */
    if (!_state.posts.length) loadFeed(true);
    openThread(parseInt(postMatch[1]));
    return;
  }

  /* 404 */
  if (pc) pc.innerHTML = '<div class="bl-empty"><div class="bl-empty-icon"><i class="fas fa-map-signs"></i></div><div class="bl-empty-title">Page not found</div><div class="bl-empty-sub"><a href="#/">Back to feed</a></div></div>';
}

function renderTagPageHeader(tag) {
  _state.tagFilter = tag;
  var skel = document.getElementById('initialSkeleton');
  if (skel) skel.style.display = '';
  var pc = document.getElementById('pageContent');
  if (pc) {
    pc.innerHTML = '<div class="bl-tag-page-hd">'
      + '<div class="bl-tag-icon-lg"><i class="fas fa-hashtag"></i></div>'
      + '<div><div class="bl-tag-page-name">#' + esc(tag) + '</div>'
      + '<div class="bl-tag-page-count" id="tagPageCount">Loading…</div></div>'
      + '</div>'
      + '<div id="tagFeedContent"></div>';
    if (skel) pc.appendChild(skel);
  }
}

function renderUserPage(author) {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div style="text-align:center;padding:40px"><span class="bl-spinner"></span></div>';

  fetchUserPosts(author, 1).then(function(data) {
    var user  = data.author || {};
    var stats = data.stats  || {};
    var posts = data.posts  || [];
    var total = data.total  || 0;

    var html = '<div class="bl-user-hd">'
      + '<div class="bl-user-banner"></div>'
      + '<div class="bl-user-body">'
      +   '<div class="bl-user-avatar-wrap">'
      +     '<img src="' + esc(user.avatar || AUTHOR_AVATAR) + '" alt="' + esc(user.name) + '"'
      +     ' onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name||author) + '&background=4ecdc4&color=0d0d0d&size=80&bold=true\'">'
      +   '</div>'
      +   '<div class="bl-user-name">' + esc(user.name || author) + '</div>'
      +   (user.bio ? '<div class="bl-user-bio">' + esc(user.bio) + '</div>' : '')
      +   '<div class="bl-user-stats">'
      +     '<div class="bl-user-stat"><div class="bl-user-stat-val">' + (stats.posts||0) + '</div><div class="bl-user-stat-lbl">Posts</div></div>'
      +     '<div class="bl-user-stat"><div class="bl-user-stat-val">' + (stats.replies||0) + '</div><div class="bl-user-stat-lbl">Replies</div></div>'
      +   '</div>'
      + '</div></div>';

    if (posts.length) {
      html += posts.map(function(p) { return buildPostCard(p); }).join('');
    } else {
      html += '<div class="bl-empty"><div class="bl-empty-icon"><i class="fas fa-feather-alt"></i></div>'
        + '<div class="bl-empty-title">No posts yet</div></div>';
    }

    pc.innerHTML = html;
    bindMediaGrids(pc);
  }).catch(function(err) {
    pc.innerHTML = '<div class="bl-empty"><div class="bl-empty-icon"><i class="fas fa-exclamation-triangle"></i></div>'
      + '<div class="bl-empty-title">Could not load profile</div>'
      + '<div class="bl-empty-sub">' + esc(err.message) + '</div></div>';
  });
}

function updateNavActive(route) {
  document.querySelectorAll('[data-route]').forEach(function(el) {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

/* ── Theme ───────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('blog_theme', theme);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

/* ── Search ──────────────────────────────────────────────── */
var _searchDebounce = null;
function handleSearchInput(val) {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function() {
    _state.searchQuery = (val || '').trim();
    _state.tagFilter   = '';
    loadFeed(true);
  }, 400);
}

/* ── Event Bindings ──────────────────────────────────────── */
function bindUI() {
  /* Theme toggle */
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', function() {
    var cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* Search */
  var searchToggle = document.getElementById('searchToggle');
  var searchBar    = document.getElementById('searchBar');
  var searchInput  = document.getElementById('searchInput');
  var searchClose  = document.getElementById('searchClose');
  if (searchToggle) searchToggle.addEventListener('click', function() {
    var isHidden = searchBar.style.display === 'none';
    searchBar.style.display = isHidden ? '' : 'none';
    if (isHidden && searchInput) setTimeout(function() { searchInput.focus(); }, 50);
  });
  if (searchClose) searchClose.addEventListener('click', function() {
    if (searchBar) searchBar.style.display = 'none';
    if (searchInput) { searchInput.value = ''; handleSearchInput(''); }
  });
  if (searchInput) searchInput.addEventListener('input', function() { handleSearchInput(this.value); });
  if (searchInput) searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { searchBar.style.display = 'none'; this.value = ''; handleSearchInput(''); }
  });

  /* Compose btn */
  var composeBtn = document.getElementById('composeBtn');
  if (composeBtn) composeBtn.addEventListener('click', function() { openComposeModal(); });

  /* Compose modal */
  var composeClose  = document.getElementById('composeClose');
  var composeCancelBtn = document.getElementById('composeCancelBtn');
  var composeSubmit = document.getElementById('composeSubmit');
  var composeText   = document.getElementById('composeText');
  if (composeClose)  composeClose.addEventListener('click', closeComposeModal);
  if (composeCancelBtn) composeCancelBtn.addEventListener('click', closeComposeModal);
  if (composeSubmit) composeSubmit.addEventListener('click', submitCompose);
  if (composeText) {
    composeText.addEventListener('input', function() { updateComposeChar(); updateComposeTags(); });
    composeText.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitCompose(); }
    });
  }

  /* File inputs */
  var imageInput = document.getElementById('composeImageInput');
  var videoInput = document.getElementById('composeVideoInput');
  var gifInput   = document.getElementById('composeGifInput');
  if (imageInput) imageInput.addEventListener('change', function() { handleFileSelect(this.files, 'image'); this.value = ''; });
  if (videoInput) videoInput.addEventListener('change', function() { handleFileSelect(this.files, 'video'); this.value = ''; });
  if (gifInput)   gifInput.addEventListener('change',   function() { handleFileSelect(this.files, 'gif');   this.value = ''; });

  /* Post modal close */
  var postModalClose = document.getElementById('postModalClose');
  var postModalBack  = document.getElementById('postModalBack');
  if (postModalClose) postModalClose.addEventListener('click', closeThreadModal);
  if (postModalBack)  postModalBack.addEventListener('click', closeThreadModal);
  var postModalOverlay = document.getElementById('postModal');
  if (postModalOverlay) postModalOverlay.addEventListener('click', function(e) {
    if (e.target === postModalOverlay) closeThreadModal();
  });

  /* Compose overlay click-outside */
  var composeModal = document.getElementById('composeModal');
  if (composeModal) composeModal.addEventListener('click', function(e) {
    if (e.target === composeModal) closeComposeModal();
  });

  /* Lightbox */
  var lbClose = document.getElementById('lbClose');
  var lbPrev  = document.getElementById('lbPrev');
  var lbNext  = document.getElementById('lbNext');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click',  function() { if (_lb.idx > 0) { _lb.idx--; renderLightbox(); } });
  if (lbNext)  lbNext.addEventListener('click',  function() { if (_lb.idx < _lb.urls.length - 1) { _lb.idx++; renderLightbox(); } });
  var lb = document.getElementById('lightbox');
  if (lb) lb.addEventListener('click', function(e) { if (e.target === lb) closeLightbox(); });

  /* Keyboard shortcuts */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeLightbox();
      closeThreadModal();
      closeComposeModal();
    }
    if (document.getElementById('lightbox') && document.getElementById('lightbox').style.display !== 'none') {
      if (e.key === 'ArrowLeft'  && _lb.idx > 0) { _lb.idx--; renderLightbox(); }
      if (e.key === 'ArrowRight' && _lb.idx < _lb.urls.length - 1) { _lb.idx++; renderLightbox(); }
    }
  });

  /* Hash navigation */
  window.addEventListener('popstate', function() {
    var hash = location.hash.replace(/^#/, '') || '/';
    handleRoute(hash);
  });

  /* Header nav links */
  document.querySelectorAll('.bh-nav-link[data-route]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigate(this.dataset.route);
    });
  });
  document.querySelectorAll('.bl-snav[data-route]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigate(this.dataset.route);
    });
  });
}

/* ── Init ────────────────────────────────────────────────── */
(function init() {
  /* Apply saved theme */
  var savedTheme = localStorage.getItem('blog_theme') || 'dark';
  applyTheme(savedTheme);

  /* Check auth */
  checkAdmin();

  /* Bind all UI events */
  bindUI();

  /* Init infinite scroll */
  initInfiniteScroll();

  /* Load sidebar data */
  loadTags();
  loadProfileStats();

  /* Route from hash */
  var hash = location.hash.replace(/^#/, '') || '/';
  handleRoute(hash);
})();
