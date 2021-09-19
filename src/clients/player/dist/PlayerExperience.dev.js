"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _client = require("@soundworks/core/client");

var _litHtml = require("lit-html");

var _renderInitializationScreens = _interopRequireDefault(require("@soundworks/template-helpers/client/render-initialization-screens.js"));

var _render = require("../shared/render.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n          <div>:-( All layers connected...</div>\n        "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n          <p>layer id: <span id=\"layer-id\">", "</span></p>\n          <p>pitch mod: <span id=\"pitch-mod\">pitch mod</span></p>\n          <p>tempo mod: <span id=\"tempo-mod\">tempo-mod</span></p>\n          <div id=\"joystick\"><div>\n        "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var PlayerExperience =
/*#__PURE__*/
function (_AbstractExperience) {
  _inherits(PlayerExperience, _AbstractExperience);

  function PlayerExperience(client) {
    var _this;

    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var container = arguments.length > 2 ? arguments[2] : undefined;

    _classCallCheck(this, PlayerExperience);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PlayerExperience).call(this, client));
    _this.config = config;
    _this.container = container;
    _this.pitchModElem = null;
    _this.tempoModElem = null;
    _this.joystickElem = null;
    _this.touchId = null;
    _this.platform = _this.require('platform');
    document.body.classList.add('player');
    (0, _renderInitializationScreens["default"])(client, config, container);
    _this.render = _this.render.bind(_assertThisInitialized(_this));
    _this.onDeviceOrientation = _this.onDeviceOrientation.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(PlayerExperience, [{
    key: "start",
    value: function start() {
      var _this2 = this;

      var layerIndex, playerState;
      return regeneratorRuntime.async(function start$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _get(_getPrototypeOf(PlayerExperience.prototype), "start", this).call(this);

              layerIndex = parseInt(sessionStorage.getItem('layerIndex'));
              _context2.next = 4;
              return regeneratorRuntime.awrap(this.client.stateManager.create('player', {
                layerIndex: layerIndex
              }));

            case 4:
              playerState = _context2.sent;
              playerState.subscribe(function _callee() {
                var layerIndex, layerId;
                return regeneratorRuntime.async(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        layerIndex = playerState.get('layerIndex');
                        layerId = playerState.get('layerId');

                        if (layerId !== null) {
                          sessionStorage.setItem('layerIndex', layerIndex);
                          (0, _litHtml.render)((0, _litHtml.html)(_templateObject(), layerId), _this2.container);
                          _this2.pitchModElem = document.getElementById("pitch-mod");
                          _this2.tempoModElem = document.getElementById("tempo-mod");
                          _this2.joystickElem = document.getElementById("joystick"); //window.addEventListener('deviceorientation', this.onDeviceOrientation);

                          _this2.container.addEventListener('touchstart', _this2.onTouchstart);

                          _this2.container.addEventListener('touchmove', _this2.onTouchmove);

                          _this2.container.addEventListener('touchend', _this2.onTouchend);
                        } else {
                          (0, _litHtml.render)((0, _litHtml.html)(_templateObject2()), _this2.container);
                        }

                      case 3:
                      case "end":
                        return _context.stop();
                    }
                  }
                });
              });

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "onTouchstart",
    value: function onTouchstart(evt) {
      if (this.touch === null) {
        this.touch = evt.changedTouches[0];
      }
    }
  }, {
    key: "onTouchmove",
    value: function onTouchmove(evt) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = TouchEvent.changedTouches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _touch = _step.value;

          if (_touch === this.touch) {
            this.joystickElem.style.left = "".concat(_touch.screenX, "px");
            this.joystickElem.style.top = "".concat(_touch.screeny, "px");
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "onTouchend",
    value: function onTouchend(e) {
      if (this.touch === touch) {
        this.touch = null;
      }
    }
  }, {
    key: "onDeviceOrientation",
    value: function onDeviceOrientation(e) {
      var beta = e.beta;
      var gamma = e.gamma;
      var leftRight = 0;
      var upDown = 0;
      beta -= 30;

      if (beta < -3) {
        upDown = (-3 - beta) / 27;
      } else if (beta > 5) {
        upDown = (3 - beta) / 27;
      }

      if (gamma < -3) {
        leftRight = (-3 - gamma) / 27;
      } else if (gamma > 5) {
        leftRight = (3 - gamma) / 27;
      }

      this.beta = beta;
      this.gamma = gamma;
      this.leftRight = Math.max(-1, Math.min(1, leftRight));
      this.upDown = Math.max(-1, Math.min(1, upDown));
      this.render();
    }
  }, {
    key: "render",
    value: function render() {
      this.pitchModElem.innerHTML = this.leftRight.toFixed(2);
      this.tempoModElem.innerHTML = this.upDown.toFixed(2);
      window.requestAnimationFrame(this.render);
    }
  }]);

  return PlayerExperience;
}(_client.AbstractExperience);

var _default = PlayerExperience;
exports["default"] = _default;