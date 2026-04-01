/* ============================================================
   CARLO BLOG — SCRIPT
   Social content platform frontend
   ============================================================ */
'use strict';

var API_BASE = 'https://carlo-portfolio-api.johncarloebora.workers.dev';

/* ── Helpers ── */
function esc(s) {
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
}

function relativeTime(iso) {
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)     return 'just now';
    if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* Parse hashtags inline (#word) and wrap them in styled spans */
function renderContent(text) {
    return esc(text).replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

/* Show toast notification */
var _toastTimer = null;
function showToast(msg, type) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() { el.className = 'toast'; }, 3500);
}

/* ── API Layer ── */
function apiFetch(path, opts) {
    return fetch(API_BASE + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}))
        .then(function(r) {
            if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || r.statusText); });
            return r.json();
        });
}

/* ── Feed State ── */
var _state = {
    posts:    [],
    page:     1,
    limit:    10,
    tag:      '',
    loading:  false,
    hasMore:  true,
    /* locally tracked reactions per post (sessionStorage) */
    reacted:  JSON.parse(sessionStorage.getItem('blog_reacted') || '{}'),
};

function saveReacted() {
    try { sessionStorage.setItem('blog_reacted', JSON.stringify(_state.reacted)); } catch(e) {}
}

/* ── Fetch posts from API ── */
function fetchPosts(reset) {
    if (_state.loading) return;
    if (!_state.hasMore && !reset) return;

    if (reset) {
        _state.page  = 1;
        _state.posts = [];
        _state.hasMore = true;
        document.getElementById('feed').innerHTML = '<div class="feed-loading" id="feedLoading"><div class="spinner"></div></div>';
    }

    _state.loading = true;
    showLoading(true);

    var url = '/api/blog/feed?page=' + _state.page + '&limit=' + _state.limit;
    if (_state.tag) url += '&tag=' + encodeURIComponent(_state.tag);

    apiFetch(url).then(function(data) {
        _state.loading = false;
        var posts = data.posts || [];
        var total = data.total || 0;
        _state.posts = reset ? posts : _state.posts.concat(posts);
        _state.hasMore = _state.posts.length < total;
        _state.page++;
        renderFeed(reset);
    }).catch(function(err) {
        _state.loading = false;
        showLoading(false);
        if (_state.page === 1) {
            document.getElementById('feed').innerHTML =
                '<div class="feed-empty"><i class="fas fa-satellite-dish"></i><p>Could not load posts.<br>Check your connection.</p></div>';
        }
    });
}

function showLoading(on) {
    var el = document.getElementById('feedLoading');
    if (el) el.style.display = on ? '' : 'none';
}

/* ── Render feed ── */
function renderFeed(reset) {
    var feed = document.getElementById('feed');
    if (!feed) return;

    if (reset) feed.innerHTML = '';

    if (_state.posts.length === 0) {
        feed.innerHTML = '<div class="feed-empty"><i class="fas fa-feather-alt"></i><p>No posts yet.</p></div>';
        return;
    }

    _state.posts.forEach(function(post) {
        if (document.getElementById('post-' + post.id)) return; /* skip duplicates */
        feed.appendChild(buildPostCard(post, false));
    });

    /* Remove old sentinel, add new one or "end" marker */
    var oldSentinel = document.getElementById('feedSentinel');
    if (oldSentinel) oldSentinel.remove();

    if (_state.hasMore) {
        var sentinel = document.createElement('div');
        sentinel.className = 'feed-sentinel';
        sentinel.id = 'feedSentinel';
        feed.appendChild(sentinel);
        _ioFeed.observe(sentinel);
    } else {
        var end = document.createElement('div');
        end.className = 'feed-end';
        end.textContent = "You're all caught up.";
        feed.appendChild(end);
    }
}

/* ── Build post card DOM element ── */
function buildPostCard(post, isReply) {
    var media  = Array.isArray(post.media)    ? post.media    : safeJSON(post.media, []);
    var tags   = Array.isArray(post.tags)     ? post.tags     : safeJSON(post.tags, []);
    var reactions = post.reactions ? (typeof post.reactions === 'object' ? post.reactions : safeJSON(post.reactions, {})) : {};
    var reacted   = _state.reacted[post.id] || null;

    var card = document.createElement('article');
    card.className = 'post-card' + (isReply ? ' thread-reply-card' : '');
    card.id = 'post-' + post.id;
    card.setAttribute('role', 'listitem');

    /* Avatar initials */
    var author  = post.author || 'Carlo';
    var initials = author.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();

    /* Media grid */
    var mediaHTML = '';
    if (media.length) {
        var gridClass = 'post-media media-' + Math.min(media.length, 4);
        var items = media.slice(0, 4).map(function(m, i) {
            var isLast = i === 3 && media.length > 4;
            var isVideo = (m.type === 'video') || /\.(mp4|webm|mov)(\?|$)/i.test(m.url || '');
            var inner = isVideo
                ? '<video src="' + esc(m.url) + '" controls preload="none"></video>'
                : '<img src="' + esc(m.url) + '" alt="' + esc(m.alt || '') + '" loading="lazy">';
            var more  = isLast ? '<div class="media-more">+' + (media.length - 3) + '</div>' : '';
            return '<div class="media-item">' + inner + more + '</div>';
        }).join('');
        mediaHTML = '<div class="' + gridClass + '">' + items + '</div>';
    }

    /* Tags */
    var tagsHTML = tags.length
        ? '<div class="post-tags">' + tags.map(function(t){return '<span class="post-tag">#' + esc(t) + '</span>';}).join('') + '</div>'
        : '';

    /* Reactions */
    var REACTIONS = [
        { key: 'like',  emoji: '👍' },
        { key: 'love',  emoji: '❤️' },
        { key: 'fire',  emoji: '🔥' },
        { key: 'clap',  emoji: '👏' },
    ];
    var reactHTML = REACTIONS.map(function(r) {
        var cnt   = (reactions[r.key] || 0);
        var done  = reacted === r.key ? ' reacted' : '';
        return '<button class="reaction-btn' + done + '" data-post="' + post.id + '" data-reaction="' + r.key + '" aria-label="' + r.key + '">' +
            r.emoji + (cnt > 0 ? ' <span>' + cnt + '</span>' : '') + '</button>';
    }).join('');

    var location = post.location ? '<span class="post-location"><i class="fas fa-map-marker-alt"></i>' + esc(post.location) + '</span>' : '';
    var replyCount = post.reply_count > 0 ? ' (' + post.reply_count + ')' : '';

    card.innerHTML =
        '<div class="post-card-header">' +
            '<div class="post-avatar">' + initials + '</div>' +
            '<div class="post-meta">' +
                '<div class="post-author">' + esc(author) + '</div>' +
                '<div class="post-time">' + relativeTime(post.created_at) + (location ? ' · ' : '') + location + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="post-body">' +
            '<p class="post-content">' + renderContent(post.content || '') + '</p>' +
            mediaHTML +
            tagsHTML +
        '</div>' +
        '<div class="post-footer">' +
            reactHTML +
            (!isReply ? '<button class="reply-btn" data-post="' + post.id + '"><i class="fas fa-comment"></i> Reply' + replyCount + '</button>' : '') +
        '</div>';

    /* Reaction events */
    card.querySelectorAll('.reaction-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            handleReaction(post.id, btn.dataset.reaction, btn);
        });
    });

    /* Reply / open thread */
    var replyBtn = card.querySelector('.reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openThread(post.id);
        });
    }

    /* Click card to open thread */
    if (!isReply) {
        card.addEventListener('click', function() { openThread(post.id); });
    }

    return card;
}

function safeJSON(val, fallback) {
    try { return val ? JSON.parse(val) : fallback; } catch(e) { return fallback; }
}

/* ── Reactions ── */
function handleReaction(postId, reaction, btn) {
    /* Toggle: if already reacted with same, remove; else set */
    var current = _state.reacted[postId] || null;
    var next    = (current === reaction) ? null : reaction;

    /* Optimistic UI */
    var card = document.getElementById('post-' + postId);
    if (card) {
        card.querySelectorAll('.reaction-btn').forEach(function(b) {
            b.classList.toggle('reacted', b.dataset.reaction === next);
        });
    }

    if (next) { _state.reacted[postId] = next; } else { delete _state.reacted[postId]; }
    saveReacted();

    /* API call */
    var payload = { reaction: next || reaction, remove: next === null };
    apiFetch('/api/blog/posts/' + postId + '/react', {
        method: 'POST',
        body: JSON.stringify(payload),
    }).then(function(data) {
        /* Update counts from server response */
        if (card && data.reactions) {
            var REACTIONS = ['like','love','fire','clap'];
            REACTIONS.forEach(function(r) {
                var b = card.querySelector('.reaction-btn[data-reaction="' + r + '"]');
                if (!b) return;
                var cnt = data.reactions[r] || 0;
                var emoji = b.textContent.split(' ')[0];
                b.innerHTML = emoji + (cnt > 0 ? ' <span>' + cnt + '</span>' : '');
                b.classList.toggle('reacted', _state.reacted[postId] === r);
            });
        }
    }).catch(function() {
        /* Revert optimistic update */
        if (current) { _state.reacted[postId] = current; } else { delete _state.reacted[postId]; }
        saveReacted();
        if (card) {
            card.querySelectorAll('.reaction-btn').forEach(function(b) {
                b.classList.toggle('reacted', b.dataset.reaction === current);
            });
        }
    });
}

/* ── Thread modal ── */
function openThread(postId) {
    var backdrop = document.getElementById('postModalBackdrop');
    var body     = document.getElementById('postModalBody');
    if (!backdrop || !body) return;

    body.innerHTML = '<div class="feed-loading"><div class="spinner"></div></div>';
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    apiFetch('/api/blog/posts/' + postId + '/thread').then(function(data) {
        renderThread(data, body);
    }).catch(function() {
        body.innerHTML = '<div class="feed-empty"><i class="fas fa-exclamation-circle"></i><p>Could not load thread.</p></div>';
    });
}

function closeThread() {
    var backdrop = document.getElementById('postModalBackdrop');
    if (backdrop) {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

function renderThread(data, container) {
    var post    = data.post;
    var replies = data.replies || [];
    container.innerHTML = '';

    /* Root post */
    var rootEl = document.createElement('div');
    rootEl.className = 'thread-post';
    rootEl.appendChild(buildPostCard(post, false));
    container.appendChild(rootEl);

    /* Replies */
    if (replies.length) {
        var repliesEl = document.createElement('div');
        repliesEl.className = 'thread-replies';

        var SHOW_LIMIT = 3;
        var shown = replies.slice(0, SHOW_LIMIT);
        var hidden = replies.slice(SHOW_LIMIT);

        shown.forEach(function(r) {
            var el = document.createElement('div');
            el.className = 'thread-reply';
            el.appendChild(buildPostCard(r, true));
            repliesEl.appendChild(el);
        });

        if (hidden.length) {
            var colBtn = document.createElement('button');
            colBtn.className = 'thread-collapsed-btn';
            colBtn.textContent = 'Show ' + hidden.length + ' more replies';
            colBtn.addEventListener('click', function() {
                hidden.forEach(function(r) {
                    var el = document.createElement('div');
                    el.className = 'thread-reply';
                    el.appendChild(buildPostCard(r, true));
                    repliesEl.insertBefore(el, colBtn);
                });
                colBtn.remove();
            });
            repliesEl.appendChild(colBtn);
        }

        container.appendChild(repliesEl);
    }

    /* Reply composer */
    var composer = document.createElement('div');
    composer.className = 'reply-composer';
    composer.innerHTML =
        '<textarea placeholder="Write a reply…" maxlength="1000" id="replyText"></textarea>' +
        '<button id="replySubmit">Reply</button>';

    composer.querySelector('#replySubmit').addEventListener('click', function() {
        var text = (composer.querySelector('#replyText').value || '').trim();
        if (!text) return;
        submitReply(post.id, text, container, data);
    });
    container.appendChild(composer);
}

function submitReply(parentId, text, container, threadData) {
    var hashtags = (text.match(/#\w+/g) || []).map(function(h){ return h.slice(1); });
    apiFetch('/api/blog/posts', {
        method: 'POST',
        body: JSON.stringify({
            content: text,
            reply_to: parentId,
            hashtags: hashtags,
            tags: hashtags,
        }),
    }).then(function(newPost) {
        threadData.replies = (threadData.replies || []).concat([newPost]);
        renderThread(threadData, container);
        showToast('Reply posted!', 'success');
    }).catch(function(err) {
        showToast(err.message || 'Could not post reply.', 'error');
    });
}

/* ── Tag filter ── */
function initTagBar(tags) {
    var bar = document.getElementById('tagBar');
    if (!bar) return;
    /* Clear except "All" button */
    bar.querySelectorAll('[data-tag]:not([data-tag=""])').forEach(function(b) { b.remove(); });
    tags.forEach(function(t) {
        var btn = document.createElement('button');
        btn.className = 'tag-filter-btn';
        btn.dataset.tag = t.tag;
        btn.textContent = '#' + t.tag + ' (' + t.count + ')';
        bar.appendChild(btn);
    });
}

function initSidebar(tags) {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar || !tags.length) return;
    sidebar.innerHTML =
        '<div class="sidebar-card">' +
        '<h3>Trending tags</h3>' +
        tags.slice(0, 12).map(function(t) {
            return '<div class="sidebar-tag-item" data-tag="' + esc(t.tag) + '">' +
                '<span>#' + esc(t.tag) + '</span>' +
                '<span class="sidebar-tag-count">' + t.count + '</span>' +
                '</div>';
        }).join('') +
        '</div>';
    sidebar.querySelectorAll('.sidebar-tag-item').forEach(function(item) {
        item.addEventListener('click', function() { setTag(item.dataset.tag); });
    });
}

function setTag(tag) {
    _state.tag = tag;
    document.querySelectorAll('.tag-filter-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tag === tag);
    });
    fetchPosts(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Infinite scroll observer ── */
var _ioFeed = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && _state.hasMore && !_state.loading) {
        fetchPosts(false);
    }
}, { rootMargin: '200px' });

/* ── Theme toggle ── */
document.getElementById('themeToggle').addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

/* ── Modal close ── */
document.getElementById('postModalClose').addEventListener('click', closeThread);
document.getElementById('postModalBackdrop').addEventListener('click', function(e) {
    if (e.target === this) closeThread();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeThread();
});

/* ── Tag bar delegation ── */
document.getElementById('tagBar').addEventListener('click', function(e) {
    var btn = e.target.closest('.tag-filter-btn');
    if (btn) setTag(btn.dataset.tag);
});

/* ── Bootstrap ── */
(function init() {
    /* Load tags then initial feed */
    apiFetch('/api/blog/tags').then(function(data) {
        var tags = data.tags || [];
        initTagBar(tags);
        initSidebar(tags);
    }).catch(function() {});

    fetchPosts(true);
})();
