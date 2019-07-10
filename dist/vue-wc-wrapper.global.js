var wrapVueWebComponent = (function () {
'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

var camelizeRE = /-(\w)/g;
var camelize = function camelize(str) {
  return str.replace(camelizeRE, function (_, c) {
    return c ? c.toUpperCase() : '';
  });
};
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = function hyphenate(str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase();
};
function getInitialProps(propsList) {
  var res = {};
  propsList.forEach(function (key) {
    res[key] = undefined;
  });
  return res;
}
function injectHook(options, key, hook) {
  options[key] = [].concat(options[key] || []);
  options[key].unshift(hook);
}
function callHooks(vm, hook) {
  if (vm) {
    var hooks = vm.$options[hook] || [];
    hooks.forEach(function (hook) {
      hook.call(vm);
    });
  }
}
function createCustomEvent(name, args) {
  return new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: args
  });
}

var isBoolean = function isBoolean(val) {
  return /function Boolean/.test(String(val));
};

var isNumber = function isNumber(val) {
  return /function Number/.test(String(val));
};

function convertAttributeValue(value, name) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      type = _ref.type;

  if (isBoolean(type)) {
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }

    if (value === '' || value === name) {
      return true;
    }

    return value != null;
  } else if (isNumber(type)) {
    var parsed = parseFloat(value, 10);
    return isNaN(parsed) ? value : parsed;
  } else {
    return value;
  }
}
function toVNodes(h, children) {
  var res = [];

  for (var i = 0, l = children.length; i < l; i++) {
    res.push(toVNode(h, children[i]));
  }

  return res;
}

function toVNode(h, node) {
  if (node.nodeType === 3) {
    return node.data.trim() ? node.data : null;
  } else if (node.nodeType === 1) {
    var data = {
      attrs: getAttributes(node),
      domProps: {
        innerHTML: node.innerHTML
      }
    };

    if (data.attrs.slot) {
      data.slot = data.attrs.slot;
      delete data.attrs.slot;
    }

    return h(node.tagName, data);
  } else {
    return null;
  }
}

function getAttributes(node) {
  var res = {};

  for (var i = 0, l = node.attributes.length; i < l; i++) {
    var attr = node.attributes[i];
    res[attr.nodeName] = attr.nodeValue;
  }

  return res;
}

function _CustomElement() {
  return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
}


Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(_CustomElement, HTMLElement);
function wrap(Vue, Component) {
  var isAsync = typeof Component === 'function' && !Component.cid;
  var isInitialized = false;
  var hyphenatedPropsList;
  var camelizedPropsList;
  var camelizedPropsMap;

  function initialize(Component) {
    if (isInitialized) return;
    var options = typeof Component === 'function' ? Component.options : Component; // extract props info

    var propsList = Array.isArray(options.props) ? options.props : Object.keys(options.props || {});
    hyphenatedPropsList = propsList.map(hyphenate);
    camelizedPropsList = propsList.map(camelize);
    var originalPropsAsObject = Array.isArray(options.props) ? {} : options.props || {};
    camelizedPropsMap = camelizedPropsList.reduce(function (map, key, i) {
      map[key] = originalPropsAsObject[propsList[i]];
      return map;
    }, {}); // proxy $emit to native DOM events

    injectHook(options, 'beforeCreate', function () {
      var _this = this;

      var emit = this.$emit;

      this.$emit = function (name) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        _this.$root.$options.customElement.dispatchEvent(createCustomEvent(name, args));

        return emit.call.apply(emit, [_this, name].concat(args));
      };
    });
    injectHook(options, 'created', function () {
      var _this2 = this;

      // sync default props values to wrapper on created
      camelizedPropsList.forEach(function (key) {
        _this2.$root.props[key] = _this2[key];
      });
    }); // proxy props as Element properties

    camelizedPropsList.forEach(function (key) {
      Object.defineProperty(CustomElement.prototype, key, {
        get: function get() {
          return this._wrapper.props[key];
        },
        set: function set(newVal) {
          this._wrapper.props[key] = newVal;
        },
        enumerable: false,
        configurable: true
      });
    });
    isInitialized = true;
  }

  function syncAttribute(el, key) {
    var camelized = camelize(key);
    var value = el.hasAttribute(key) ? el.getAttribute(key) : undefined;
    el._wrapper.props[camelized] = convertAttributeValue(value, key, camelizedPropsMap[camelized]);
  }

  var CustomElement =
  /*#__PURE__*/
  function (_CustomElement2) {
    _inherits(CustomElement, _CustomElement2);

    function CustomElement() {
      var _this3;

      _classCallCheck(this, CustomElement);

      var self = _this3 = _possibleConstructorReturn(this, _getPrototypeOf(CustomElement).call(this));

      self.attachShadow({
        mode: 'open'
      });
      var wrapper = self._wrapper = new Vue({
        name: 'shadow-root',
        customElement: self,
        shadowRoot: self.shadowRoot,
        data: function data() {
          return {
            props: {},
            slotChildren: []
          };
        },
        render: function render(h) {
          return h(Component, {
            ref: 'inner',
            props: this.props
          }, this.slotChildren);
        }
      }); // Use MutationObserver to react to future attribute & slot content change

      var observer = new MutationObserver(function (mutations) {
        var hasChildrenChange = false;

        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];

          if (isInitialized && m.type === 'attributes' && m.target === self) {
            syncAttribute(self, m.attributeName);
          } else {
            hasChildrenChange = true;
          }
        }

        if (hasChildrenChange) {
          wrapper.slotChildren = Object.freeze(toVNodes(wrapper.$createElement, self.childNodes));
        }
      });
      observer.observe(self, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
      return _this3;
    }

    _createClass(CustomElement, [{
      key: "connectedCallback",
      value: function connectedCallback() {
        var _this4 = this;

        var wrapper = this._wrapper;

        if (!wrapper._isMounted) {
          // initialize attributes
          var syncInitialAttributes = function syncInitialAttributes() {
            wrapper.props = getInitialProps(camelizedPropsList);
            hyphenatedPropsList.forEach(function (key) {
              syncAttribute(_this4, key);
            });
          };

          if (isInitialized) {
            syncInitialAttributes();
          } else {
            // async & unresolved
            Component().then(function (resolved) {
              if (resolved.__esModule || resolved[Symbol.toStringTag] === 'Module') {
                resolved = resolved.default;
              }

              initialize(resolved);
              syncInitialAttributes();
            });
          } // initialize children


          wrapper.slotChildren = Object.freeze(toVNodes(wrapper.$createElement, this.childNodes));
          wrapper.$mount();
          this.shadowRoot.appendChild(wrapper.$el);
        } else {
          callHooks(this.vueComponent, 'activated');
        }
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        callHooks(this.vueComponent, 'deactivated');
      }
    }, {
      key: "vueComponent",
      get: function get() {
        return this._wrapper.$refs.inner;
      }
    }]);

    return CustomElement;
  }(_CustomElement);

  if (!isAsync) {
    initialize(Component);
  }

  return CustomElement;
}

return wrap;

}());
