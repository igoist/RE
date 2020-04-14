(() => {
  $ = {
    d: document,
    b: chrome || browser,
    v: {
      debug: true,
      bg: 'huaban-bg',
      me: 'huaban-logic',
    },
    s: {},
    f: {
      debug: o => {
        if (o && $.v.debug) {
          console.log(o);
        }
      },
      // set a DOM property or text attribute
      set: o => {
        if (typeof o.el[o.att] === 'string') {
          o.el[o.att] = o.string;
        } else {
          o.el.setAttribute(o.att, o.string);
        }
      },
      // remove a DOM element
      kill: o => {
        if (o.el && o.el.parentNode) {
          o.el.parentNode.removeChild(o.el);
        }
      },
      // create a DOM element
      make: o => {
        var el = false,
          t,
          a,
          k;
        for (t in o) {
          el = $.d.createElement(t);
          for (a in o[t]) {
            if (typeof o[t][a] === 'string') {
              $.f.set({ el: el, att: a, string: o[t][a] });
            } else {
              if (a === 'style') {
                for (k in o[t][a]) {
                  el.style[k] = o[t][a][k];
                }
              }
            }
          }
          break;
        }
        return el;
      },
      // send a message
      sendMessage: o => {
        // $.f.debug('Sending message in logic');
        o.via = $.v.me;
        if (!o.to) {
          o.to = 'background';
        }
        // $.f.debug(JSON.stringify(o));
        $.b.runtime.sendMessage(o);
      },
      // open an iframe overlay
      openOverlay: o => {
        // be sure there's an ID; don't open more than one copy of any overlay
        if (o.id && !$.s[o.id]) {
          // let path = "/html/" + o.id + ".html";
          // let path = 'http://localhost:6100/';
          let path = '/html/index.html';

          let overlayStyle = [
            'border: none',
            'display: block',
            'position: fixed',
            'height: 100%',
            'width: 100%',
            'top: 0',
            'right: 0',
            'bottom: 0',
            'left: 0',
            'margin: 0',
            'clip: auto',
            'opacity: 1',
            'z-index: 9223372036854775807'
          ];

          const writeStyles = el => {
            // our iframes should never have class names
            el.removeAttribute('class');
            // brute force our styles because we want !important on each item
            el.setAttribute('style', overlayStyle.join('!important;'));
            // connect a mutation observer to watch for changes in iframe styling
            // witnessMe();
          };

          $.s[o.id] = $.f.make({
            IFRAME: {
              src: $.b.extension.getURL(path)
              // src: path
            }
          });

          writeStyles($.s[o.id]);

          // after we load, request data
          $.s[o.id].onload = () => {
            // optional background thing to do after loading
            if (o.act) {
              $.f.sendMessage({ to: 'background', act: o.act });
            }
            // might be able to combine this with o.act
            if (o.callback) {
              o.callback();
            }
          };

          document.body.append($.s[o.id]);
        }
      },
      // close an iframe overlay
      closeOverlay: o => {
        if (o.id && $.s[o.id]) {
          $.f.debug('closing ' + o.id);
          $.f.kill({ el: $.s[o.id] });
          delete $.s[o.id];
        }
      },
      act: {
        openREPartner: () => {
          $.f.openOverlay({ id: 'REPartner' });
        },
        closeREPartner: () => {
          $.f.closeOverlay({ id: 'REPartner' });
        }
      },
      init: () => {
      }
    }
  };

  // if an incoming message from script is for us and triggers a function in $.f.act, run it
  $.b.runtime.onMessage.addListener(r => {
    if (r.to === $.v.me || r.to === 'huaban-logic') {
      $.f.debug('Message received in logic.');
      $.f.debug(r);
      if (r.act && typeof $.f.act[r.act] === 'function') {
        $.f.act[r.act](r);
      }
    }
  });

  $.f.init();
})();
