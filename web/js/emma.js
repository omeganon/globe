if (!window.RequestAnimationFrame) {
  window.RequestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (f) { return setTimeout(f, 0); };
}
if(System.support.webgl === false){

  var message = document.createElement( 'div' );
  message.style.cssText = 'font-family:monospace;font-size:13px;text-align:center;color:#fff;background:#333;padding:1em;width:540px;margin:30em auto 0';
  message.innerHTML = 'Either your graphics card or your browser does not support WebGL.<br /><a href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">View a list</a> of WebGL compatible browsers.';
  document.body.appendChild( message );
  document.body.style.background = '#000000';

} else {

  var $container = $('#container');
  var globe_scale = parseInt(ORBITAL.Util.getParameterByName('globeScale'), 10) || 1;
  var viewtype = ORBITAL.Util.getParameterByName('type') || 'tracker';
//  var globe_rotate = parseFloat(ORBITAL.Util.getParameterByName('rotate')) || -0.001;
  var rotate = ORBITAL.Util.getParameterByName('rotate') || 't';
  (rotate === 'f') ? globe_rotate = 0 : globe_rotate = -0.001;
  if (viewtype === 'app') {
    var types = {
      'LOGIN': 0,
      'EDITOR': 0,
      'MAIL': 0,
      'RESPONSE': 0,
      'ACCT_JUMP': 0,
      'IMPORT': 0,
      'EXPORT': 0,
      'SCHEDULED': 0,
      'AUDIENCE': 0,
      'BILLING': 0, 
      'PASSWORD_RESET': 0, 
      'UPLOAD': 0, 
      'ACTIVATE': 0, 
      'PASSWORD_CHANGE': 0, 
    }
  } else {
    var types = {
      'track': 0,
      'click': 0,
      'webview': 0,
      'message': 0,
      'sendtofriend': 0,
      'optout' : 0
    };
  }
//  console.log(globe_scale);
  var globe = new ORBITAL.Globe($container, {scale: globe_scale, rotate: globe_rotate});
  globe.animate(globe_rotate);

  var addGeoPoint = function(latitude, longitude) {
    var point = globe.getPoint(latitude, longitude);
//    console.log('latitude: ' + latitude + ', longitude: ' + longitude);
    if (!point) {
      point = {lat:latitude, lng:longitude, mag:0};
    }

    var mag = point.mag;
    var add = 0;

    var scale = 1;

    if (mag < 0.01 * scale) {
      add = 10;
    } else if (mag < 0.05 * scale) {
      add = 5;
    } else if (mag < 0.1 * scale) {
      add = 1;
    } else if (mag < 0.3 * scale) {
      add = 0.5;
    } else if (mag < 0.6 * scale) {
      add = 0.3;
    } else if (mag < 0.9 * scale) {
      add = 0.1;
    } else if (mag == 1 * scale) {
      add = 0;
    } else {
      add = 0;
    }

    point.mag += add * 0.001;
    globe.addPoint(point.lat, point.lng, point.mag);

  };

  var handleGeoEvent = function(e) {
    var startTime = new Date();
    var data = JSON.parse(e.data);
    var geo = data.geo;

    if (geo) { // geo might be undefined
      addGeoPoint(geo.latitude, geo.longitude);
      types[e.type]++;
      requestAnimationFrame(function(){showPost(data);});
    }

  };

  var showPost = _.debounce(function(message) {
   
    var mb = ""; 
    for (var key in types) {
      if (types.hasOwnProperty(key)) {
      mb += "<div class='key'>" + key + "</div><div class='value'>" + types[key] + "</div><br>";
      }
    }

    var postinfo = $("#postInfo");

    var $postbox = $("<div>");
    var $post = $("<div>");
    var $avatar = $("<img>");

    $postbox.addClass("postbox");
    $post.addClass("post");
    $avatar.addClass("avatar");

    $post.html(mb);

    $postbox.append($post);

    postinfo.html($postbox);

    delete mb;
    while(postinfo.height() > window.innerHeight){
      $("#postInfo div:first").remove();
    }
  }, 0);

  var ageGeoPoints = function() {
    for (var key in globe.pointCache) {
      var point = globe.pointCache[key];
      point.age().update();
    }
    _.delay(ageGeoPoints, 0.1);
  };
  ageGeoPoints();

  try {
    var ev = new EventSource("http://sys01.int:8083/stats");
  } catch (e) {
    var ev = new EventSourcePollyfill("http://sys01.int:8083/stats");
  }

  for (var key in types) {
    if (types.hasOwnProperty(key)) {
    ev.addEventListener(key, handleGeoEvent);
    }
  }
}
