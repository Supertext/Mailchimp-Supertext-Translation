// Supertext Translation for Mailchimp: the little the pages do in the browser.
// API calls carry the session cookie and the page's CSRF token.
(function () {
  'use strict';
  var body = document.body;
  var csrf = body.getAttribute('data-csrf') || '';
  var locale = body.getAttribute('data-locale') || 'en';

  function api(method, path, data) {
    return fetch(path, {
      method: method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, 'Accept-Language': locale },
      body: data ? JSON.stringify(data) : undefined,
    }).then(function (response) {
      return response.json().then(function (json) {
        return { ok: response.ok, json: json };
      });
    });
  }

  function checked(form, name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  // --- Translate page -------------------------------------------------------
  var form = document.getElementById('translate-form');
  if (form) {
    var button = document.getElementById('translate-button');
    var message = document.getElementById('form-message');
    var overwrite = document.getElementById('overwrite');
    var warning = document.getElementById('overwrite-warning');
    var hint = document.getElementById('overwrite-hint');
    var updateButton = function () {
      var count = checked(form, 'language').length;
      var label = button.getAttribute('data-label');
      if (count > 0) {
        var plural = new Intl.PluralRules(locale).select(count) === 'one' ? 'data-label-one' : 'data-label-other';
        label = button.getAttribute(plural).replace('{count}', String(count));
      }
      button.textContent = label;
    };
    form.addEventListener('change', function (event) {
      if (event.target && event.target.name === 'language') updateButton();
    });
    if (overwrite) {
      overwrite.addEventListener('change', function () {
        warning.hidden = !overwrite.checked;
        hint.hidden = overwrite.checked;
      });
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var campaign = checked(form, 'campaign')[0];
      var languages = checked(form, 'language');
      if (!campaign || languages.length === 0) {
        message.textContent = button.getAttribute('data-select');
        return;
      }
      message.textContent = '';
      button.disabled = true;
      button.textContent = button.getAttribute('data-starting');
      api('POST', '/api/jobs', {
        campaignId: campaign,
        languages: languages,
        overwrite: Boolean(overwrite && overwrite.checked),
      }).then(function (result) {
        if (!result.ok) {
          button.disabled = false;
          updateButton();
          message.textContent = (result.json.error && result.json.error.message) || 'Error';
          return;
        }
        poll(result.json.id, function () {
          // Reload so the list shows the new drafts.
          window.location.href = '/?campaign=' + encodeURIComponent(campaign);
        });
      });
    });
    updateButton();
  }

  var panel = document.getElementById('job-panel');
  function poll(id, finished) {
    api('GET', '/api/jobs/' + encodeURIComponent(id)).then(function (result) {
      if (!result.ok) return;
      panel.innerHTML = result.json.html;
      if (result.json.status === 'running') {
        setTimeout(function () {
          poll(id, finished);
        }, 2000);
      } else if (finished) {
        finished();
      }
    });
  }
  if (panel && panel.getAttribute('data-job')) poll(panel.getAttribute('data-job'));

  // --- Settings page --------------------------------------------------------
  var test = document.getElementById('test-button');
  if (test) {
    var resultText = document.getElementById('test-result');
    test.addEventListener('click', function () {
      var label = test.textContent;
      test.disabled = true;
      test.textContent = test.getAttribute('data-testing');
      resultText.textContent = '';
      resultText.className = '';
      var keyInput = document.querySelector('input[name="apiKey"]');
      api('POST', '/api/test', { apiKey: keyInput ? keyInput.value : '' }).then(function (result) {
        test.disabled = false;
        test.textContent = label;
        resultText.textContent = result.json.message || '';
        resultText.className = result.json.ok ? 'ok' : 'failed';
      });
    });
  }

  var targets = document.getElementById('targets');
  if (targets) {
    targets.addEventListener('change', function (event) {
      var input = event.target;
      if (input && input.name === 'target') {
        var row = input.closest('tr');
        if (row) row.className = input.checked ? 'chosen' : 'other';
      }
    });
  }

  var disconnect = document.getElementById('disconnect-form');
  if (disconnect) {
    disconnect.addEventListener('submit', function (event) {
      if (!window.confirm(disconnect.getAttribute('data-confirm'))) event.preventDefault();
    });
  }
})();
