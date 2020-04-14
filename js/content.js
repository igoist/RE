(() => {
  chrome.runtime.sendMessage({
    to: 'huaban-bg',
    act: 'injectLogic'
  });

  // const exId = 'kfajbgpmhinphopgjjempdcgihajeejb';

  // let o = {
  //   to: 'huaban-bg',
  //   me: 'XXX',
  //   via: 'xxX'
  // };

  // // let msg = JSON.stringify(o);
  // let msg = o;

  // chrome.runtime.sendMessage(exId, msg);
})();
