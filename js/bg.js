let arr = [];
let oForArr = {};
let tmpI = 0;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo && changeInfo.status === 'complete') {
    if (!oForArr[tab.url] && !tab.url.startsWith('chrome')) {
      arr.push({
        i: tmpI++,
        url: tab.url,
        title: tab.title
      });
      oForArr[tab.url] = 1;
    }
  }
});

((w, a) => {
  const $ = {
    w: w,
    a: a,
    b: chrome || browser,
    v: {
      debug: true,
      me: 'huaban-bg',
      logic: 'huaban-logic',
      testActiveTab: null, // for test!!!
    },
    f: {
      debug: o => {
        if (o && $.v.debug) {
          console.log(o);
        }
      },
      setLocal: o => {
        $.b.storage.local.set(o);
      },
      // send something to content script
      send: o => {
        $.f.debug('Request to send message to content script received.');
        $.f.debug(o);
        // send to the active tab && special part for debug
        if ($.v.testActiveTab) {
          $.b.tabs.sendMessage($.v.testActiveTab.id, o);
          return ;
        }
        $.f.getTab({
          callback: tab => {
            currentTab = tab;
            // avoid sending to non-http tabs like about:blank
            if (tab.url.match(/^https?:\/\//)) {
              $.v.testActiveTab = tab; // for test!!!
              $.f.debug('Active tab has a valid URL: ' + tab.url);
              $.b.tabs.sendMessage(tab.id, o);
            } else {
              $.f.debug('Could not send message; we need http protocol.');
              $.f.debug(tab.url);
            }
          }
        });
      },
      act: {
        // inject business logic
        injectLogic: o => {
          /*
            since all messages are filtered for tab ID, passing it to
            executeScript will prevent situations where someone starts
            loading a slow page, switches to a different tab, and we
            try to inject logic into the current (wrong) tab.
          */
          $.f.debug('Injecting logic into tab ' + o.tabId);
          $.b.tabs.executeScript(o.tabId, {
            file: 'js/logic.js'
          });
        },
        openREPartner: () => {
          $.f.send({ to: $.v.logic, act: 'openREPartner' });
        },
        readyToCloseREPartner: () => {
          $.f.send({ to: 'ex-REP', msg: 'readyToCloseREPartner' });
        },
        closeREPartner: () => {
          console.log('enter closeGrid');
          $.f.send({ to: $.v.logic, act: 'closeREPartner' });
        },
        sendDataToTabList: (o) => {
          $.f.send({ to: o.via, data: arr });
        },
        resetTabArr: (o) => {
          console.log('here ========= ', o);
        }
      },
      getTab: o => {
        if (o.callback) {
          $.b.tabs.query({ active: true, currentWindow: true }, tab => {
            // do we have an array of tabs, is there at least one tab, does it have an URL?
            if (((tab || {})[0] || {}).url) {
              o.callback(tab[0]);
            } else {
              /*
                Something else failed higher up, leaving us without an array of tabs to check.
                Do nothing; next tab refresh will hopefully sort things out.
              */
              // $.f.debug(
              //   "Tab or window switch detected but no tabs came back from query; this tab may contain an URL that won't run our logic."
              // );
            }
          });
        }
      },
      houseKeep: () => {
        $.f.setLocal({ debug: $.v.debug });
      },
      init: () => {
        // $.f.houseKeep();

        $.b.browserAction.onClicked.addListener(r => {
          $.f.act.openREPartner();
        });
      }
    }
  };

  window.xtz = $;

  $.b.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    $.f.debug('in ' + $.v.me + ', onMessage: ');
    $.f.debug(request);
    if (request.to === $.v.me) {
      // confirm we know what tab the message came from
      if (((sender || {}).tab || {}).id) {
        if (
          request.act &&
          typeof $.f.act[request.act] === 'function'
        ) {
          // add the tabId to the request so we can specify it if needed
          request.tabId = sender.tab.id;
          $.f.act[request.act](request);
        }
      }
    }
  });

  $.f.init();
})(window, {
  browserTest: [
    {
      k: "ff",
      r: / Firefox\//
    },
    {
      k: "op",
      r: / OPR\//
    },
    {
      k: "ms",
      r: / Edg\//
    },
    {
      k: "cr",
      r: / Chrome\//
    }
  ],
  translateThese: {
  }
});
