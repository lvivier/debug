
/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Does this console support styles?
 */
var styles = !!(window.chrome || (console.exception && console.table));

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};
  var c = color();

  return styles ? colored : plain;

  function colored(fmt){
    fmt = coerce(fmt);

    var subs = countsubs(fmt);
    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = '%c' + name + ' %c'
        + fmt + ' %c+' + debug.humanize(ms);

    // build args with color substitutions
    var args = [fmt, c, 'color:black']
      .concat([].slice.call(arguments, 1, subs+1))
      .concat([c])
      .concat([].slice.call(arguments, subs+1));

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    log(args);
  }

  function plain(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    log(arguments);
  }

  // This hackery is required for IE8
  // where `console.log` doesn't have 'apply'
  function log(args){
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, args);
  }
}

/**
 * Browser colors.
 */
var colors = ['#4DD9ED', '#95E346', '#E3DB7D', '#0000AE', '#B180FB', '#FF266F'];

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Select a color.
 */

function color() {
  return 'color:'+colors[prevColor++ % colors.length];
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

/**
 * Count substitutions in a string.
 */

function countsubs(msg){
  return ((msg).match(/(%[sdiocf])/mg)||[]).length;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}
