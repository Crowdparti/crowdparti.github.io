(function(){var fin = { macro_scope: function (func, name) { func(); return func; }, macro: function (func, modu, scope) { return func; }, modules: {}};fin.__base=function (fin) {
  fin.$A = function () {
    var str = '';
    for (var i = 0; i < arguments.length; i++) {
      str = str + arguments[i];
    }
    return str;
  }

  fin.guidi = (function () {
    var guidCounter = 0;
    return function () {
      return (Date.now() + guidCounter++);
    }
  })();




  fin.define = function (_creator, _super) {

    _super = _super || Object;
    var proto = {};
    Object.assign(proto, _super.prototype);
    var _class = _creator(proto, _super);
    _class.super_class = _super;

    _class.prototype = Object.create(_super.prototype);
    Object.assign(_class.prototype, proto);
    return (_class);
  };

  fin.queue = fin.define(function (proto) {

    proto.size = function () {
      return this._newestIndex - this._oldestIndex;
    };
    proto.enqueue = function (data) {
      this._storage[this._newestIndex++] = data;
      return data;
    };

    proto.realign = function () {
      let count = this.size();
      let i = 0;
      for (i = 0; i < count; i++) {
        this._storage[i + 1] = this._storage[this._oldestIndex + i];
      }
      for (i = this._oldestIndex; i < this._newestIndex; i++) {
        this._storage[i] = undefined;
      }

      this._oldestIndex = 1;
      this._newestIndex = this._oldestIndex + count;
    }


    proto.dequeue = function () {
      if (this._oldestIndex !== this._newestIndex) {
        var deletedData = this._storage[this._oldestIndex];
        this._storage[this._oldestIndex++] = undefined;
        return deletedData;
      }
    };

    proto.fast_dequeue = function () {
      return this._storage[this._oldestIndex++];
    };

    proto.peek = function () {
      return this._storage[this._oldestIndex];
    }

    return function queue() {
      this._oldestIndex = 1;
      this._newestIndex = 1;
      this._storage = {};
    }

  });

  fin.typed_memory = fin.define(function (proto) {

    proto.alloc = function (size) {
      this.pointer += size;
      return new this.type(this.mem.buffer, (this.pointer - size) * this.type.BYTES_PER_ELEMENT, size);
    }
    proto.extract = function (donot_reset) {
      var arr = new this.type(this.pointer);
      console.log(arr);
      arr.set(new this.type(this.mem.bufer, 0, this.pointer), 0);
      if (!donot_reset) this.pointer = 0;
      return arr;
    }
    return function typed_memory(type, size) {
      this.pointer = 0;
      this.type = type;
      this.mem = new type(size);
    }

  });

  fin.merge_sort = (function (array, comparefn) {
    var i, j, k;
    function merge(arr, aux, lo, mid, hi, comparefn) {
      i = lo;
      j = mid + 1;
      k = lo;

      while (true) {
        if (comparefn(arr[i], arr[j]) <= 0) {
          aux[k++] = arr[i++];
          if (i > mid) {
            do
              aux[k++] = arr[j++];
            while (j <= hi);
            break;
          }
        } else {
          aux[k++] = arr[j++];
          if (j > hi) {
            do
              aux[k++] = arr[i++];
            while (i <= mid);
            break;
          }
        }
      }
    }

    function sortarrtoaux(arr, aux, lo, hi, comparefn) {
      if (hi < lo) return;
      if (hi == lo) {
        aux[lo] = arr[lo];
        return;
      }
      var mid = Math.floor(lo + (hi - lo) * 0.5);
      sortarrtoarr(arr, aux, lo, mid, comparefn);
      sortarrtoarr(arr, aux, mid + 1, hi, comparefn);
      merge(arr, aux, lo, mid, hi, comparefn);
    }

    function sortarrtoarr(arr, aux, lo, hi, comparefn) {
      if (hi <= lo) return;
      var mid = Math.floor(lo + (hi - lo) * 0.5);
      sortarrtoaux(arr, aux, lo, mid, comparefn);
      sortarrtoaux(arr, aux, mid + 1, hi, comparefn);
      merge(aux, arr, lo, mid, hi, comparefn);
    }


    var aux = [], ai = 0;;
    function merge_sort(arr, al, comparefn) {
      ai = 0;
      for (i = 0; i < al; i++)
        aux[ai++] = arr[i];

      sortarrtoarr(arr, aux, 0, al - 1, comparefn);
      return arr;
    }



    return merge_sort;
  })();
  fin.url_loader = (function () {
    var parking = new fin.queue();
    var xtp = new XMLHttpRequest;
    function process(url, cb, t, params) {

      if (xtp.isBusy) {
        parking.enqueue([url, cb, t, params]);
        return;
      }
      xtp.onload = function () {
        if (cb) cb(this.response, params);
        this.abort();
        this.isBusy = false;

        if (parking.size() > 0) {
          process.apply(this, parking.dequeue());
        }
      };
      xtp.responseType = t || "text";
      xtp.isBusy = true;
      xtp.open("GET", url, !0);
      xtp.send();
    }
    return process;

  })();




  fin.urls_loader = (function () {
    var parking = new fin.queue();
    function process(urls, cb, params) {
      if (parking.isBusy) {
        parking.enqueue([urls, cb, params]);
        return;
      }
      var datas = [];
      fin.each_index(function (i, next) {
        parking.isBusy = true;
        fin.url_loader(urls[i][0], function (data) {
          datas.push(data);
          if (i < urls.length - 1) next(i + 1)
          else {
            if (cb) cb(datas, params);
            if (parking.size() > 0) {
              parking.isBusy = false;
              process.apply(this, parking.dequeue());
            }
          }


        }, urls[i][1]);

      })


    }
    return process;

  })();

  fin.array = fin.define(function (proto) {
    proto.push = function (element) {
      this.data[this.length++] = element;
      return this;
    };

    var i = 0;
    proto.push_args = function () {
      for (i = 0; i < arguments.length; i++)
        this.data[this.length++] = arguments[i];
    }

    proto.append_other = function (other) {
      for (i = 0; i < other.length; i++) {
        this.data[this.length++] = other.data[i];
      }
    }
    proto.peek = function () {
      return this.data[this.length - 1];
    };

    proto.pop = function () {
      if (this.length === 0) return null;
      return this.data[--this.length];
    };

    proto.clear = function () {
      this.length = 0;
    };

    proto.for_each = function (cb, self) {
      this.index = 0;
      while (this.index < this.length) {
        cb(this.data[this.index], this.index++, self);
      }
      this.index = 0;
    };

    proto.next = function () {
      if (this.index < this.length) {
        return this.data[this.index++];
      }
      return null;

    };
    proto.float32Array = function () {
      var f = new Float32Array(this.length);
      for (i = 0; i < this.length; i++)
        f[i] = this.data[i];

      return f;
    }
    return function array() {
      this.data = [];
      this.length = 0;
      this.index = 0;
    }
  });
  fin.object_pooler = fin.define(function (proto) {

    proto.get = function (params) {
      if (this.freed > 0) {
        if (this.reuse)
          return this.reuse(this.free_objects[--this.freed], params);
        else
          return this.free_objects[--this.freed];
      }
      else {
        if (this.allocated >= this.pool_size) return null
        this.allocated++;
        return this.creator(params);
      }

    };
    proto.free = function (obj) {
      this.free_objects[this.freed++] = obj;
    };
    return function object_pooler(creator, reuse, pool_size) {
      this.creator = creator;
      this.reuse = reuse;
      this.allocated = 0;
      this.freed = 0;
      this.pool_size = pool_size || Infinity;
      this.free_objects = [];
    };
  });

  fin.object_pooler_ext = fin.define(function (proto, _super) {
    proto.free = function (obj) {
      this.free_objects[this.freed++] = obj;
      if (this.on_free !== null) this.on_free(obj);
    };
    proto.get = function (params) {
      if (this.freed > 0) {
        if (this.reuse)
          return this.reuse(this.free_objects[--this.freed], params);
        else
          return this.free_objects[--this.freed];
      }
      else {
        if (this.allocated >= this.pool_size) return null
        this.allocated++;
        return this.reuse(this.creator(), params);
      }
    };


    return function object_pooler_ext(creator, reuse, pool_size) {
      _super.apply(this, arguments);
      this.on_free = null;

    };
  }, fin.object_pooler);

  fin.event = fin.define(function (proto) {
    proto.add = function (cb, callee) {
      callee = callee || this.owner;
      this.handlers[this.handlers.length] = [cb, callee];
    };
    proto.trigger = function (params) {
      for (var i = 0; i < this.handlers.length; i++)
        if (this.handlers[i][0].apply(this.handlers[i][1], params) === false) return false;
    };

    proto.trigger_params = function () {
      for (var i = 0; i < this.handlers.length; i++)
        if (this.handlers[i][0].apply(this.handlers[i][1], this.params) === false) return false;
    };

    return function event(owner, params) {
      this.owner = owner;
      this.handlers = [];
      this.params = params;
    };
  });

  fin.merge_arrays = function () {
    var arr = [], i1, i2;
    for (i1 = 0; i1 < arguments.length; i1++) {
      for (i2 = 0; i2 < arguments[i1].length; i2++) {
        arr.push(arguments[i1][i2]);
      }
    }

    return arr;
  }

  fin.each_index = function (callback, index) {
    var func = function (index) {
      callback(index, func);
    };
    func(index || 0);
  }

  fin.rg = function (match, func) {
    if (match !== null) match.forEach(func);
  }

  fin.merge_object = (function () {
    var key, type;
    var func = function (source, dest, merge_only_not_exist) {
      for (var key in source) {
        type = Object.prototype.toString.call(source[key]).toLocaleLowerCase();
        if (type === '[object object]') {
          if (dest[key] !== undefined) func(source[key], dest[key], merge_only_not_exist);
          else if (merge_only_not_exist) {
            dest[key] = {};
            func(source[key], dest[key], merge_only_not_exist);
          }
        }
        else {
          if (merge_only_not_exist) {
            if (dest[key] === undefined) {
              dest[key] = source[key];
            }
          }
          else {
            dest[key] = source[key];
          }
        }
      }
      return dest;
    }
    return func;

  })();
  fin.create_float32 = (function (len, creator) {
    creator = creator || function (out) {
      return out;
    }
    var x = 0;
    return function () {
      var out = creator(new Float32Array(len));
      if (arguments[0] === undefined) return out;
      if (arguments.length === 1 && arguments[0].length > 0) {
        for (x = 0; x < arguments[0].length; x++)
          if (x < len) out[x] = arguments[0][x];
      }
      else {
        for (x = 0; x < arguments.length; x++)
          if (x < len) out[x] = arguments[x];
      }
      return out;
    }
  });
  fin.is_function = function (obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  fin.is_string = function(x) {
    return Object.prototype.toString.call(x) === "[object String]"
  }
  fin.traverse_object = (function () {
    let key;
    function func(obj, cb, pkey) {
      pkey = pkey || "";
      pkey = pkey.length > 0 ? pkey + "." : pkey;
      for (key in obj) {
        if (Object.prototype.toString.call(obj[key]).toLocaleLowerCase() === '[object object]' || fin.is_function(obj[key])) {
          func(obj[key], cb, pkey + key);
        }
        else cb(pkey + key, obj[key], obj, key);
      }
    }

    return func;

  })();

  fin.parse_args_from_func = function (text) {
    var args;
    fin.rg(text.match(/function.*\(.*\)/), function (s) {
      args = s.replace(/function.*\(/, '').replace(')', '').split(",");
      args.forEach(function (a, i) {
        args[i] = a.trim();
      })
    });

    return args || [];
  }

  fin.trace_brackets = function (chars, i, st, et) {
    var bc = 1;
    st = st || '{';
    et = et || '}';
    while (bc !== 0 && i < chars.length) {
      if (chars[i] === st) bc++;
      else if (chars[i] === et) bc--;
      i++;
    }
    return i;
  }

  fin.ping_pong_array = fin.define(function (proto) {
    var temp;
    proto.swap = function () {
      temp = this[this.ping_name];
      this[this.ping_name] = this[this.pong_name];
      this[this.pong_name] = temp;
      temp = undefined;
    };
    return function ping_pong_array(ping_name, pong_name) {
      this.ping_name = ping_name;
      this.pong_name = pong_name;
      this[ping_name] = [];
      this[pong_name] = [];

    };
  });

  fin.str_uint8 = function (str, pad) {
    pad = pad || 0;
    var arr = new Uint8Array((str.length + (pad - (str.length % pad))));
    arr.fill(32);
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  }

  fin.worker = (function () {
    var modules = {
      'base': fin.__base,
    }

    return {
      modules: modules,
      use_modules: function (src, mods, cb) {
        if (cb) {
          mods.forEach(function (m) {
            if (!m) return;
            if (!fin.is_function(m)) {
              if (modules[m]) {
                src.push('(' + cb(modules[m].toString()) + ')(self)');
              }
              else {
                cb(src.push(m));
              }
             
            }
            else src.push('(' + cb(m.toString()) + ')(self)');

          });
        }
        else {
          mods.forEach(function (m) {
            if (!m) return;
            if (!fin.is_function(m)) {
              if (modules[m]) {
                src.push('(' + cb(modules[m].toString()) + ')(self)');
              }
              else {
                src.push(m);
              }
            }
            else src.push('(' + m.toString() + ')(self)');

          });
        }

        return src;
      },
      build: function (mods) {
        var src = this.use_modules([], mods);
       // console.log(src.join(';'));
        var wkr = new Worker(window.URL.createObjectURL(new Blob([
          'var fin={};fin.__base=' + fin.__base.toString() + ';fin.__base(fin);' +
          src.join(";")

        ])));

        return wkr
      },

      wid: 1,
      workers: {},
      data_command_worker: function (def) {

        var worker = this.build(fin.merge_arrays([
          function (worker) {


            var ci = 0, nci = 0, dt;
            worker.last_time = 0;
            worker.time = 0;
            worker.oi = 0;

            worker.windup = [];
            worker.outputs = [];

            worker.def = {};

            worker.commands = {};
            worker.signals = {};


            

            worker.commands[1] = function (dt, ci) {
              worker.time = dt[ci];


              worker.time_delta = worker.time - worker.last_time;
              worker.last_time = time;
            }

            worker.commands[-1024] = function (dt, ci) {
              (new Function('return ' + worker.unpack_string_command(dt, ci))())(worker);
            };

            worker.unpack_string_command = function (dt, ci) {
              return String.fromCharCode.apply(this, new Uint8Array(dt.buffer, ci * 4, dt[ci - 2] * 4));
            }
            worker.add_output = function (oid, func) {
              this.outputs.push([oid, func]);
            };


            

            worker.commands[-99990] = function (dt, ci) {
              worker.def = JSON.parse(worker.unpack_string_command(dt, ci));
              worker.out_signals = new Float32Array(def.commands_size);
              worker.si = 0;


              (function (sg) {
                var si = 0;

                worker.begin_signal = function (wid, sid, size) {
                  sg[this.si++] = wid;
                  sg[this.si++] = size + 1;
                  sg[this.si++] = sid;
                  ci = this.si;
                  this.si += size;
                  return ci;
                };

                worker.send_signal1v = function (wid, sid, s1) {
                  si = this.begin_signal(wid, sid, 1);
                  sg[si++] = s1;
                };

                worker.send_signal2v = function (wid, sid, s1, s2) {
                  si = this.begin_signal(wid, sid, 2);
                  sg[si++] = s1;
                  sg[si++] = s2;
                };
                worker.send_signal3v = function (wid, sid, s1, s2, s3) {
                  si = this.begin_signal(wid, sid, 3);
                  sg[si++] = s1;
                  sg[si++] = s2;
                  sg[si++] = s3;
                };

                worker.send_signal4v = function (wid, sid, s1, s2, s3,s4) {
                  si = this.begin_signal(wid, sid, 4);
                  sg[si++] = s1;
                  sg[si++] = s2;
                  sg[si++] = s3;
                  sg[si++] = s4;
                };
              })(worker.out_signals);
            };

            var sig_size = 0,sid;
            worker.commands[-99991] = function (dt, ci) {
              sig_size = dt[ci++];
              sid = dt[ci++];
              if (worker.signals[sid]) {
                worker.signals[sid](dt, ci, ci + (sig_size - 1));
              }
            }

            
           

           

            worker.prepare_signals = function (dt, oi) {
              
              for (ci = 0; ci < this.si; ci++) {

                dt[oi++] = this.out_signals[ci];
              }
              this.si = 0;
              return oi;
            }

            var  oi_count;
            worker.onmessage = function (m) {
             
              ci = 0;
              this.data = new Float32Array(m.data[0]);

              dt = this.data;

              ccount = dt[ci++];

              while (ci < ccount) {
                nci = dt[ci++];                      
                this.commands[dt[ci++]](dt, ci);
                ci += nci;
              }
              this.oi = 0;
              dt[0] = 1919991;
              for (ci = 0; ci < this.outputs.length; ci++) {
                oi_count = this.outputs[ci][1](dt, this.oi + 2);

                
                if (oi_count - this.oi > 2) {                
                  dt[this.oi] = this.outputs[ci][0];
                  dt[this.oi + 1] = oi_count;

                  this.oi = oi_count;
                }

              }

             

              for (ci = 0; ci < this.windup.length; ci++) {
                this.windup[ci](dt,this.oi);
              }


              oi_count = this.prepare_signals(dt, this.oi + 2);
              if (oi_count - this.oi > 2) {                
                dt[this.oi] = -99991;
                dt[this.oi + 1] = oi_count;
                this.oi = oi_count;
              }
              else {
                dt[this.oi] = 1919991;
              }
              this.postMessage([dt.buffer], [dt.buffer]);

            }

          }

        ], def.mods));

        worker.wid = fin.worker.wid++;
        def.name = def.name || ("Worker" + worker.wid);

        worker.name = def.name;

        this.workers[worker.wid] = worker;
        this.workers[worker.name] = worker;


        def.data_size = def.data_size || (1024 * 200);
        def.commands_size = def.commands_size || (1024 * 50);

        worker.is_working = true;
        worker.data = new Float32Array(def.data_size );
        worker.command_data = new Float32Array(def.commands_size );
        worker.ci = 0;
        worker.oi = 0;
        var ci = 0;
      

       
        worker.outputs = {};

        worker.add_output = function (oid, func) {
          this.outputs[oid] = func;
        };

        var oid, oi_count,old_ci;

        worker.dispatch_outputs = function (dt) {
          this.oi = 1;
          oid = dt[0];

          //;
          
          while (this.outputs[oid]) {


            oi_count = dt[this.oi++];

            this.outputs[oid](dt, this.oi, oi_count);
            this.oi = oi_count;
            oid = dt[this.oi++];
          }
        }
        worker.onmessage = function (m) {
          this.data = new Float32Array(m.data[0]);
          this.data_callback = true;
          this.dispatch_outputs(this.data);
          this.data_callback = false;

        }

        worker.begin_command = function (c, nums) {
          this.command_data[this.ci++] = nums;
          this.command_data[this.ci++] = c;
          ci = this.ci;
          this.ci += nums;
          return ci;
        };

        

        worker.execute = function (func) {
          this.pack_string_command(-1024, func.toString());
        };

        worker.pack_string_command = function (cmd,str) {
          var flo32 = new Float32Array(fin.str_uint8(str, 4).buffer);
          ci = this.begin_command(cmd, flo32.length);

          for (var i = 0; i < flo32.length; i++)
            this.command_data[ci++] = flo32[i];
        }

        worker.commands_group = function (host, ref) {
          host(ref, this.command_data, this);
        };

        worker.commands_group(function (self, cmd) {

          var ci = 0, ii = 0;

          self.send_signal = function (dt, oi, size) {           
            ci = this.begin_command(-99991, size+1);
            cmd[ci++] = size;
            for (ii = 0; ii < size; ii++) {
              cmd[ci++] = dt[oi++];
            }

          }
        },worker);

       

        delete def.mods;
        def.wid = worker.wid;
        worker.update = function (timer) {
          if (this.data.buffer.byteLength > 0) {
            this.data[1] = 1;
            this.data[2] = 1;
            this.data[3] = timer;

            ci = 0;
            this.data[0] = this.ci + 4;
            while (ci < this.ci) {
              this.data[ci + 4] = this.command_data[ci++];
            }
            this.ci = 0;
            this.postMessage([this.data.buffer], [this.data.buffer]);


          }
        }
        worker.pack_string_command(-99990, JSON.stringify(def));


        var sig_size,wid;
        worker.add_output(-99991, function (dt, oi, count) {
          while (oi < count) {
            wid = dt[oi++];
            sig_size = dt[oi++];
            
            fin.worker.workers[wid].send_signal(dt, oi, sig_size);
            oi += sig_size;

          }
          


        });

        return worker;
      }
    }


  })()

  console.log(fin.worker);



};fin.__base(fin);
const _FM=fin.modules;
_FM["fin"]=fin;
_FM["ecs"]=new Object();
(function(){ return function index(fin) {
  var ecs = this;


  


  ecs.systems = {};
  ecs.components = {};

  ecs.app = fin.define(function (proto) {

    proto.sort_systems = function () {
      this._systems = fin.merge_sort(this._systems, this._systems.length, function (a, b) {
        return a.priority - b.priority;
      });
    }

    proto.iterate_entities = (function () {
      var comp = null;
      return function (name_id) {
        comp = this.components[name_id];
        if (comp === undefined) return null;
        if (comp.ei === -1) comp.ei = 0;
        if (comp.ei < comp.entities.length) {
          return this.entities[comp.entities[comp.ei++]];
        }
        comp.ei = -1;
        return null;
      }
    })();

    proto.use_system = function (name_id, def) {
      var sys = this.systems[name_id];
      if (!sys) {
        
        sys = new ecs.systems[name_id](def, this);        
        sys.name_id = name_id;
        this.systems[name_id] = sys;
        this._systems[this._systems.length] = sys;
        sys.validate(this);
        this.sort_systems();
        this.required_validation = true;
      }
      return sys;
    };

    proto.validate = function () {
      if (this.required_validation === true) {
        this.required_validation = false;
        for (i = 0; i < this._systems.length; i++) {
          this._systems[i].validate(this);
        }
        this.sort_systems();
      }

    };
    var name_id, i = 0;
    var comp, sys;
    proto.use_component = function (name_id) {
      if (!this.components[name_id]) {
        comp = ecs.components[name_id];
        this.components[name_id] = {
          priority: comp.priority,
          name_id: name_id, set_instance: null,
          creator: comp, app: this, entities: [],ins_map:[], ei: 0
        };
        if (comp.super_class.name_id !== undefined) {
          this.components[name_id].parent = this.use_component(comp.super_class.name_id)
        }
       
        if (comp.validate) comp.validate(this.components[name_id]);
        this._components.push(this.components[name_id]);
        this._components = fin.merge_sort(this._components, this._components.length, function (a, b) {
          return a.priority - b.priority;
        });

        this.required_validation = true;
      }
      return this.components[name_id];
    };

    var ei;
    proto.map_component_entity = function (e, comp, ins, map_name) {
      ei = comp.entities.length;
      comp.entities[ei] = e.uuid;
      comp.ins_map[ei] = map_name || comp.name_id;
      if (!map_name) {
        e[comp.name_id] = ins;
        map_name = comp.name_id;
      }
      if (comp.parent) this.map_component_entity(e, comp.parent, ins, map_name);

    };
    proto.attach_component = function (e, name_id, def) {
      comp = this.use_component(name_id);
      
      if (e[comp.name_id]) return e[comp.name_id];
      var ins
      if (comp.creator.is_functional) {
        ins = comp.creator(def, e, this, comp);
      }
      else {
        ins = new comp.creator(def, e, this, comp);
      }
       
      comp = this.components[name_id];      
      this.map_component_entity(e, this.components[name_id], ins);
      return e[comp.name_id];
    };

    proto.create_entity = function (def) {
      def = def || {};
      var entity = { uuid: def.uuid || fin.guidi() };
      this.entities[entity.uuid] = entity;
      if (def.components) {
        for (name_id in def.components) {
          this.use_component(name_id);
        }



        for (var i = 0; i < this._components.length; i++) {
          comp = this._components[i];
          

          if (def.components[comp.name_id]) {
            this.attach_component(entity, comp.name_id, def.components[comp.name_id]);
          }
        }

      }
      return entity;
    };


    proto.step = function (cb) {
      this.timer = performance.now() * 0.001;
      
     
      this.current_time_delta = this.timer - this.last_timer;
      if (this.current_time_delta < this.req_time_delta) {
        return;
      }

      this.current_time_delta = Math.max(this.req_time_delta, this.current_time_delta);
      this.current_time_delta = Math.min(this.req_time_delta * 2, this.current_time_delta);

      this.last_timer = this.timer - (this.current_time_delta % this.req_time_delta);

      this.validate();


      var i = 0, time_start = 0, s_count = this._systems.length;



      this._app_cb.apply(this);
      for (i = 0; i < s_count; i++) {
        sys = this._systems[i];
        if (sys.enabled === true) {
          sys.time_delta = this.timer - sys.last_step_time;
          if (sys.time_delta > sys.step_size) {
            sys.step_start();
          }

        }
      }

      for (i = 0; i < s_count; i++) {
        sys = this._systems[i];
        if (sys.enabled === true) {
          if (sys.time_delta > sys.step_size) {
            time_start = Date.now();
            sys.step();
            sys.on_frame.trigger();
            sys.frame_time = (Date.now() - time_start);
          }

        }
      }

      for (i = 0; i < s_count; i++) {
        sys = this._systems[i];
        if (sys.enabled === true) {
          if (sys.time_delta > sys.step_size) {
            sys.step_end();
            
            sys.last_step_time = this.timer - (sys.time_delta % sys.step_size);
          }
        }
      }

    };

    
    proto.start = function (cb,time_delta) {
      var app = this;
      app._app_cb = cb || function () { };
      app.req_time_delta = time_delta || (1 / 60);
      this.timer = performance.now() * 0.001;
      this.last_timer = this.timer 
      function step1() {        
        app.step();
        requestAnimationFrame(step2);
      }
      function step2() {        
        app.step();
        requestAnimationFrame(step1);
      }
      app.step();
      requestAnimationFrame(step1);
    }

    return function ecs_app(def) {
      def = def || {};
      
      this.systems = {};
      this.components = {};
      this._components = [];
      this._systems = [];
      this.entities = {};

      if (def.systems) {
        for (var s in def.systems) {
          this.use_system(s);
        }
      }


    }


  });


  ecs.component = fin.define(function (proto) {
    function component() { }
    return component;
  });

  ecs.system = fin.define(function (proto) {
    proto.validate = function (ecs) { };
    proto.step_start = function () { };
    proto.step = function () { };
    proto.step_end = function () { };

    function system(def, app) {
      def = def || {};
      this.uuid = def.uuid || fin.guidi();
      this.state = 1;
      this.step_size = 1 / 60;
      this.last_step_time = 0;
      this.worked_items = 0;
      this.enabled = true;
      this.time_delta = 0;
      this.app = app;
      this.on_frame = new fin.event(this);
      this.status_text = "";
    }
    return system;
  });


  ecs.register_component = function (name_id, comp) {
    comp.name_id = name_id;
    this.components[comp.name_id] = comp;
    comp.priority = ecs.register_component.priority;
    ecs.register_component.priority += 1000;
  };

  ecs.register_component.priority = 1000;


  ecs.register_system = function (name_id, sys) {
    sys.name_id = name_id;
    this.systems[sys.name_id] = sys;
  };

  console.log("ecs", ecs);
}})().apply(_FM["ecs"],[_FM["fin"]]);
_FM["math"]=new Object();
(function(){ return function index(fin) {
  var math = this;

  

  Object.assign(this,{"DEGTORAD":0.017453292519943295,"RADTODEG":57.29577951308232});

  this.module_export_code = function () {

    this.byte_code = this.byte_code.replace("/*STR_CONSTANTS*/", 'Object.assign(this,' + this.str_constants + ');');

  }


  math.vec2 = fin.create_float32(2);
  math.vec3 = fin.create_float32(3);
  math.vec4 = fin.create_float32(4);
  math.utils = {};

  math.utils.get_bias = function (time, bias) {
    return (time / ((((1.0 / bias) - 2.0) * (1.0 - time)) + 1.0));
  };

  math.utils.get_gain = function (time, gain) {
    if (time < 0.5)
      return this.get_bias(time * 2.0, gain) / 2.0;
    else
      return this.get_bias(time * 2.0 - 1.0, 1.0 - gain) / 2.0 + 0.5;
  }

  math.vec3.pool = new fin.object_pooler(function () {
    return math.vec3();
  });


  math.mat3 = fin.create_float32(9, function (out) {
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  });

  math.mat4 = fin.create_float32(16, function (out) {
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  });

  math.quat = fin.create_float32(4, function (out) {
    out[3] = 1;
    return out;
  });


  math.dquat = fin.create_float32(8, function (out) {
    out[3] = 1;
    return out;
  });

  math.aabb = fin.create_float32(6);

  //vec3
  fin.macro_scope(function (scope, $i, $j, $x, $y, $z,$w, $qx, $qy, $qz, $qw, $A, $uvx, $uvy, $uvz, $uuvx, $uuvy, $uuvz,$mat) {



    math.vec3.set = fin.macro(function vec3_set(v$, x$, y$, z$) {
      v$[0] = x$; v$[1] = y$; v$[2] = z$;
    }, math);

    math.vec3.zero = fin.macro(function vec3_zero(v$) {
      v$[0] = 0; v$[1] = 0; v$[2] = 0;
    }, math);


    fin.macro(function vec3_decompose(v$, x$, y$, z$) {
      x$ = v$[0]; y$ = v$[1]; z$ = v$[2];
    }, math);


    fin.macro(function vec3_length_sqr(a$) {
      a$[0] * a$[0] + a$[1] * a$[1] + a$[2] * a$[2];
    }, math);

    fin.macro(function vec3_length(a$) {
      Math.abs(Math.sqrt(a$[0] * a$[0] + a$[1] * a$[1] + a$[2] * a$[2]));
    }, math);



    math.vec3.length_sq = function (a) {
      return (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    };


    math.vec3.get_length = function (a) {
      return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    };

    math.vec3.negate = fin.macro(function vec3_negate(v$) {
      v$[0] = -v$[0]; v$[1] = -v$[1]; v$[2] = -v$[2];
    }, math);


    math.vec3.calc_distance = function calc_distance(x0, y0, z0, x1, y1, z1) {
      x1 = (x1 - x0);
      y1 = (y1 - y0);
      z1 = (z1 - z0);
      return Math.abs(Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1));
    };



    math.vec3.normalize = fin.macro(function vec3_normalize(out$, a$) {
      $x = a$[0] * a$[0] + a$[1] * a$[1] + a$[2] * a$[2];
      if ($x > 0) {
        $x = 1 / Math.sqrt($x);
      }
      out$[0] = a$[0] * $x; out$[1] = a$[1] * $x; out$[2] = a$[2] * $x;
    }, math, scope);

    math.vec3.transform_quat = fin.macro(function vec3_transform_quat(out$, a$, q$) {

      $x = a$[0]; $y = a$[1]; $z = a$[2];
      $qx = q$[0]; $qy = q$[1]; $qz = q$[2]; $qw = q$[3];


      $uvx = $qy * $z - $qz * $y;
      $uvy = $qz * $x - $qx * $z;
      $uvz = $qx * $y - $qy * $x;


      $uuvx = $qy * $uvz - $qz * $uvy;
      $uuvy = $qz * $uvx - $qx * $uvz;
      $uuvz = $qx * $uvy - $qy * $uvx;

      
      $A = $qw * 2;
      $uvx *= $A;
      $uvy *= $A;
      $uvz *= $A;

      $uuvx *= 2;
      $uuvy *= 2;
      $uuvz *= 2;

      out$[0] = $x + $uvx + $uuvx;
      out$[1] = $y + $uvy + $uuvy;
      out$[2] = $z + $uvz + $uuvz;



    }, math, scope);





    math.vec3.copy = fin.macro(function vec3_copy(out$, v$) {
      out$[0] = v$[0]; out$[1] = v$[1]; out$[2] = v$[2];
    }, math);

    math.vec3.scale = fin.macro(function vec3_scale(out$, v$, s$) {
      out$[0] = v$[0] * s$; out$[1] = v$[1] * s$; out$[2] = v$[2] * s$;
    }, math);


    math.vec3.scale_add = fin.macro(function vec3_scale_add(out$, a$, b$, s$) {
      out$[0] = a$[0] + b$[0] * s$; out$[1] = a$[1] + b$[1] * s$; out$[2] = a$[2] + b$[2] * s$;
    }, math);



    math.vec3.cross = fin.macro(function vec3_cross(out$, a$, b$) {
      out$[0] = a$[1] * b$[2] - a$[2] * b$[1];
      out$[1] = a$[2] * b$[0] - a$[0] * b$[2];
      out$[2] = a$[0] * b$[1] - a$[1] * b$[0];
    }, math);


    math.vec3.transform_mat4 = fin.macro(function vec3_transform_mat4(out$, a$, m$) {
      $x = a$[0]; $y = a$[1]; $z = a$[2];
      $w = 1 / (m$[3] * $x + m$[7] * $y + m$[11] * $z + m$[15]);
      $mat = m$;
      out$[0] = (($mat[0] * $x + $mat[4] * $y + $mat[8] * $z) + $mat[12]) * $w;
      out$[1] = (($mat[1] * $x + $mat[5] * $y + $mat[9] * $z) + $mat[13]) * $w;
      out$[2] = (($mat[2] * $x + $mat[6] * $y + $mat[10] * $z) + $mat[14]) * $w;
    }, math, scope);


    math.vec3.transform_mat3 = fin.macro(function vec3_transform_mat3(out$, a$, m$) {
      $x = a$[0]; $y = a$[1]; $z = a$[2];
      $mat = m$;

      out$[0] = $x * $mat[0] + $y * $mat[3] + $z * $mat[6];
      out$[1] = $x * $mat[1] + $y * $mat[4] + $z * $mat[7];
      out$[2] = $x * $mat[2] + $y * $mat[5] + $z * $mat[8];
    }, math, scope);


    math.vec3.transform_mat4x = fin.macro(function vec3_transform_mat4x(out$, vx$, vy$, vz$, m$) {
      $x = vx$; $y = vy$; $z = vz$;
      $w = 1 / (m$[3] * $x + m$[7] * $y + m$[11] * $z + m$[15]);

      out$[0] = ((m$[0] * $x + m$[4] * $y + m$[8] * $z) + m$[12]) * $w;
      out$[1] = ((m$[1] * $x + m$[5] * $y + m$[9] * $z) + m$[13]) * $w;
      out$[2] = ((m$[2] * $x + m$[6] * $y + m$[10] * $z) + m$[14]) * $w;
    }, math, scope);


    math.vec3.add = fin.macro(function vec3_add(out$, a$, b$) {
      out$[0] = a$[0] + b$[0]; out$[1] = a$[1] + b$[1]; out$[2] = a$[2] + b$[2];
    }, math);

    math.vec3.subtract = fin.macro(function vec3_subtract(out$, a$, b$) {
      out$[0] = a$[0] - b$[0]; out$[1] = a$[1] - b$[1]; out$[2] = a$[2] - b$[2];
    }, math);


    math.vec3.multiply = fin.macro(function vec3_multiply(out$, a$, b$) {
      out$[0] = a$[0] * b$[0]; out$[1] = a$[1] * b$[1]; out$[2] = a$[2] * b$[2];
    }, math);


    math.vec3.dot = function (a,b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    };


  }, "math.vec3");

  //vec4
  fin.macro_scope(function (scope) {

    math.vec4.set = fin.macro(function vec4_set(v$, x$, y$, z$,w$) {
      v$[0] = x$; v$[1] = y$; v$[2] = z$; v$[3] = w$;
    }, math);


    math.vec4.copy = fin.macro(function vec4_copy(out$, v$) {
      out$[0] = v$[0]; out$[1] = v$[1]; out$[2] = v$[2]; out$[3] = v$[3];
    }, math);
    


  }, "math.vec4");



  //mat3
  fin.macro_scope(function (scope, $bx, $by, mat1$, mat2$, mat3$, $a00, $a01, $a02, $a03, $a10, $a11, $a12, $a20, $a21, $a22, $b00, $b01, $b02, $b10, $b11, $b12, $b20, $b21, $b22) {

    

    math.mat3.translate_rotate_scale = fin.macro(function mat3_translate_rotate_scale(out$, x$, y$, sx$, sy$, rad$) {
      $bx = Math.sin(rad$);
      $by = Math.cos(rad$);

      out$[0] = ($by * 1 + $bx * 0) * sx$;
      out$[1] = ($by * 0 + $bx * 1) * sx$;
      out$[2] = ($by * 0 + $bx * 0) * sx$;

      out$[3] = ($by * 0 - $bx * 1) * sy$;
      out$[4] = ($by * 1 - $bx * 0) * sy$;
      out$[5] = ($by * 0 - $bx * 0) * sy$;

      out$[6] = x$ * out$[0] + y$ * out$[3];
      out$[7] = x$ * out$[1] + y$ * out$[4];
      out$[8] = x$ * out$[2] + y$ * out$[5];


    }, math, scope);


    math.mat3.from_quat = fin.macro(function mat3_from_quat(out$, q$) {


      $a00 = q$[0];
      $a01 = q$[1];
      $a02 = q$[2];
      $a03 = q$[3];

      $b00 = $a00 + $a00;
      $b01 = $a01 + $a01;
      $b02 = $a02 + $a02;

      $a10  = $a00 * $b00;
      $a11  = $a01 * $b00;
      $a12  = $a01 * $b01;

      $a20  = $a02 * $b00;
      $a21  = $a02 * $b01;
      $a22  = $a02 * $b02;

      $b10  = $a03 * $b00;
      $b11  = $a03 * $b01;
      $b11  = $a03 * $b02;

      out$[0] = 1 - $a12 - $a22;
      out$[3] = $a11 - $b11;
      out$[6] = $a20 + $b11;

      out$[1] = $a11 + $b11;
      out$[4] = 1 - $a10 - $a22;
      out$[7] = $a21 - $b10;

      out$[2] = $a20 - $b11;
      out$[5] = $a21 + $b10;
      out$[8] = 1 - $a10 - $a12;




    }, math, scope);

    math.mat3.copy = fin.macro(function mat3_copy(out$, a$) {      
      out$[0] = a$[0];
      out$[1] = a$[1];
      out$[2] = a$[2];
      out$[3] = a$[3];
      out$[4] = a$[4];
      out$[5] = a$[5];
      out$[6] = a$[6];
      out$[7] = a$[7];
      out$[8] = a$[8];
    }, math, scope);


  
    math.mat3.set_diagonal = fin.macro(function mat3_set_diagonal(out$, x$,y$,z$) {
      out$[0] = x$;
      out$[4] = y$;
      out$[8] = z$;

    }, math, scope);

    math.mat3.mult = fin.macro(function mat3_mult(out$,a$, b$) {

      mat1$ = out$;
      mat2$ = a$;
      mat3$ = b$;

      $a00 = mat2$[0]; $a01 = mat2$[1]; $a02 = mat2$[2];
      $a10 = mat2$[3]; $a11 = mat2$[4]; $a12 = mat2$[5];
      $a20 = mat2$[6]; $a21 = mat2$[7]; $a22 = mat2$[8];
      $b00 = mat3$[0]; $b01 = mat3$[1]; $b02 = mat3$[2];
      $b10 = mat3$[3]; $b11 = mat3$[4]; $b12 = mat3$[5];
      $b20 = mat3$[6]; $b21 = mat3$[7]; $b22 = mat3$[8];


      mat1$[0] = $b00 * $a00 + $b01 * $a10 + $b02 * $a20;
      mat1$[1] = $b00 * $a01 + $b01 * $a11 + $b02 * $a21;
      mat1$[2] = $b00 * $a02 + $b01 * $a12 + $b02 * $a22;

      mat1$[3] = $b10 * $a00 + $b11 * $a10 + $b12 * $a20;
      mat1$[4] = $b10 * $a01 + $b11 * $a11 + $b12 * $a21;
      mat1$[5] = $b10 * $a02 + $b11 * $a12 + $b12 * $a22;

      mat1$[6] = $b20 * $a00 + $b21 * $a10 + $b22 * $a20;
      mat1$[7] = $b20 * $a01 + $b21 * $a11 + $b22 * $a21;
      mat1$[8] = $b20 * $a02 + $b21 * $a12 + $b22 * $a22;
    }, math, scope);



  }, "math.mat3");


  //mat4
  fin.macro_scope(function (scope, $a00, $a01, $a02, $a03, $a04, $a05, $a06, $a07, $a08, $a09, $a10, $a11, $a12, $a13, $a20, $a21, $a22, $a23, $a30, $a31, $a32, $a33, $det, $b00, $b01, $b02, $b03, $b04, $b05, $b06, $b07, $b08, $b09, $b10,$b11, $mat1, $mat2, $mat3, $vec1,$A,$B,$C) {




    math.mat4.identity = fin.macro(function mat4_identity(out$) {
      out$.fill(0); out$[0] = 1; out$[5] = 1; out$[10] = 1; out$[15] = 1;
    }, math, scope);

    math.mat4.perspective = fin.macro(function mat4_perspective(out$, fovy$, aspect$, near$, far$) {
      $mat1 = out$;

      $a00 = 1.0 / Math.tan(fovy$ / 2);
      $mat1[0] = $a00 / aspect$;
      $mat1[1] = 0;
      $mat1[2] = 0;
      $mat1[3] = 0;
      $mat1[4] = 0;
      $mat1[5] = $a00;
      $mat1[6] = 0;
      $mat1[7] = 0;
      $mat1[8] = 0;
      $mat1[9] = 0;
      $mat1[11] = -1;
      $mat1[12] = 0;
      $mat1[13] = 0;
      $mat1[15] = 0;
      if (far$ != null && far$ !== Infinity) {
        $a00 = 1 / (near$ - far$);
        $mat1[10] = (far$ + near$) * $a00;
        $mat1[14] = (2 * far$ * near$) * $a00;
      } else {
        $mat1[10] = -1;
        $mat1[14] = -2 * near$;
      }
    }, math, scope);


    math.mat4.ortho = fin.macro(function mat4_ortho(out$, left$, right$, bottom$, top$, near$, far$) {

      $mat1 = out$;

      $a00 = 1 / (left$ - right$);
      $a01 = 1 / (bottom$ - top$);
      $a02 = 1 / (near$ - far$);
      $mat1[0] = -2 * $a00;
      $mat1[1] = 0; $mat1[2] = 0; $mat1[3] = 0; $mat1[4] = 0;
      $mat1[6] = 0; $mat1[7] = 0; $mat1[8] = 0; $mat1[9] = 0;
      $mat1[5] = -2 * $a01;
      $mat1[10] = 2 * $a02;
      $mat1[11] = 0;
      $mat1[12] = (left$ + right$) * $a00;
      $mat1[13] = (top$ + bottom$) * $a01;
      $mat1[14] = (far$ + near$) * $a02;
      $mat1[15] = 1;
    }, math, scope);





    math.mat4.inverse = fin.macro(function mat4_inverse(out$, a$) {

      $mat1 = out$;
      $mat2 = a$;


      $a00 = $mat2[0]; $a01 = $mat2[1]; $a02 = $mat2[2]; $a03 = $mat2[3];
      $a10 = $mat2[4]; $a11 = $mat2[5]; $a12 = $mat2[6]; $a13 = $mat2[7];
      $a20 = $mat2[8]; $a21 = $mat2[9]; $a22 = $mat2[10]; $a23 = $mat2[11];
      $a30 = $mat2[12]; $a31 = $mat2[13]; $a32 = $mat2[14]; $a33 = $mat2[15];


      $b00 = $a00 * $a11 - $a01 * $a10;
      $b01 = $a00 * $a12 - $a02 * $a10;
      $b02 = $a00 * $a13 - $a03 * $a10;
      $b03 = $a01 * $a12 - $a02 * $a11;
      $b04 = $a01 * $a13 - $a03 * $a11;
      $b05 = $a02 * $a13 - $a03 * $a12;
      $b06 = $a20 * $a31 - $a21 * $a30;
      $b07 = $a20 * $a32 - $a22 * $a30;
      $b08 = $a20 * $a33 - $a23 * $a30;
      $b09 = $a21 * $a32 - $a22 * $a31;
      $b10 = $a21 * $a33 - $a23 * $a31;
      $b11 = $a22 * $a33 - $a23 * $a32;

      $det = $b00 * $b11 - $b01 * $b10 + $b02 * $b09 + $b03 * $b08 - $b04 * $b07 + $b05 * $b06;

      if ($det) {
        $det = 1.0 / $det;

        $mat1[0] = ($a11 * $b11 - $a12 * $b10 + $a13 * $b09) * $det;
        $mat1[1] = ($a02 * $b10 - $a01 * $b11 - $a03 * $b09) * $det;
        $mat1[2] = ($a31 * $b05 - $a32 * $b04 + $a33 * $b03) * $det;
        $mat1[3] = ($a22 * $b04 - $a21 * $b05 - $a23 * $b03) * $det;
        $mat1[4] = ($a12 * $b08 - $a10 * $b11 - $a13 * $b07) * $det;
        $mat1[5] = ($a00 * $b11 - $a02 * $b08 + $a03 * $b07) * $det;
        $mat1[6] = ($a32 * $b02 - $a30 * $b05 - $a33 * $b01) * $det;
        $mat1[7] = ($a20 * $b05 - $a22 * $b02 + $a23 * $b01) * $det;
        $mat1[8] = ($a10 * $b10 - $a11 * $b08 + $a13 * $b06) * $det;
        $mat1[9] = ($a01 * $b08 - $a00 * $b10 - $a03 * $b06) * $det;
        $mat1[10] = ($a30 * $b04 - $a31 * $b02 + $a33 * $b00) * $det;
        $mat1[11] = ($a21 * $b02 - $a20 * $b04 - $a23 * $b00) * $det;
        $mat1[12] = ($a11 * $b07 - $a10 * $b09 - $a12 * $b06) * $det;
        $mat1[13] = ($a00 * $b09 - $a01 * $b07 + $a02 * $b06) * $det;
        $mat1[14] = ($a31 * $b01 - $a30 * $b03 - $a32 * $b00) * $det;
        $mat1[15] = ($a20 * $b03 - $a21 * $b01 + $a22 * $b00) * $det;
      }



    }, math, scope);

    math.mat4.transpose = fin.macro(function mat4_transpose(out$, a$) {

      out$[1] = a$[4];
      out$[2] = a$[8];
      out$[3] = a$[12];
      out$[4] = a$[1];
      out$[6] = a$[9];
      out$[7] = a$[13];
      out$[8] = a$[2];
      out$[9] = a$[6];
      out$[11] = a$[14];
      out$[12] = a$[3];
      out$[13] = a$[7];
      out$[14] = a$[11];

    }, math, scope);


    math.mat4.from_quat = fin.macro(function mat4_from_quat(out$, q$) {

      $mat1 = out$;
      $vec1 = q$;

      $a00 = $vec1[0]; $a01 = $vec1[1]; $a02 = $vec1[2]; $a03 = $vec1[3];
      $a05 = $a00 + $a00;
      $a06 = $a01 + $a01;
      $a07 = $a02 + $a02;

      $b00 = $a00 * $a05;
      $b01 = $a00 * $a06;
      $b02 = $a00 * $a07;
      $b03 = $a01 * $a06;
      $b04 = $a01 * $a07;
      $b05 = $a02 * $a07;
      $b06 = $a03 * $a05;
      $b07 = $a03 * $a06;
      $b08 = $a03 * $a07;


      $mat1[0] = (1 - ($b03 + $b05));
      $mat1[1] = ($b01 + $b08);
      $mat1[2] = ($b02 - $b07);
      $mat1[3] = 0;
      $mat1[4] = ($b01 - $b08);
      $mat1[5] = (1 - ($b00 + $b05));
      $mat1[6] = ($b04 + $b06);
      $mat1[7] = 0;
      $mat1[8] = ($b02 + $b07);
      $mat1[9] = ($b04 - $b06);
      $mat1[10] = (1 - ($b00 + $b03));
      $mat1[11] = 0;

    }, math, scope);




    math.mat4.scale = fin.macro(function mat4_scale(out$, scale$) {

      $mat1 = out$;
      $vec1 = scale$;


      $mat1[0] *= $vec1[0];
      $mat1[1] *= $vec1[0];
      $mat1[2] *= $vec1[0];
      $mat1[3] *= $vec1[0];

      $mat1[4] *= $vec1[1];
      $mat1[5] *= $vec1[1];
      $mat1[6] *= $vec1[1];
      $mat1[7] *= $vec1[1];


      $mat1[8] *= $vec1[2];
      $mat1[9] *= $vec1[2];
      $mat1[10] *= $vec1[2];
      $mat1[11] *= $vec1[2];

    }, math, scope);


    math.mat4.multiply= fin.macro(function mat4_multiply(out$, a$, b$) {

      $mat1 = out$;
      $mat2 = a$;
      $mat3 = b$;


      $a00 = $mat2[0]; $a01 = $mat2[1]; $a02 = $mat2[2]; $a03 = $mat2[3];
      $a10 = $mat2[4]; $a11 = $mat2[5]; $a12 = $mat2[6]; $a13 = $mat2[7];
      $a20 = $mat2[8]; $a21 = $mat2[9]; $a22 = $mat2[10]; $a23 = $mat2[11];
      $a30 = $mat2[12]; $a31 = $mat2[13]; $a32 = $mat2[14]; $a33 = $mat2[15];


      $b00 = $mat3[0]; $b01 = $mat3[1]; $b02 = $mat3[2]; $b03 = $mat3[3];
      $mat1[0] = $b00 * $a00 + $b01 * $a10 + $b02 * $a20 + $b03 * $a30;
      $mat1[1] = $b00 * $a01 + $b01 * $a11 + $b02 * $a21 + $b03 * $a31;
      $mat1[2] = $b00 * $a02 + $b01 * $a12 + $b02 * $a22 + $b03 * $a32;
      $mat1[3] = $b00 * $a03 + $b01 * $a13 + $b02 * $a23 + $b03 * $a33;

      $b00 = $mat3[4]; $b01 = $mat3[5]; $b02 = $mat3[6]; $b03 = $mat3[7];
      $mat1[4] = $b00 * $a00 + $b01 * $a10 + $b02 * $a20 + $b03 * $a30;
      $mat1[5] = $b00 * $a01 + $b01 * $a11 + $b02 * $a21 + $b03 * $a31;
      $mat1[6] = $b00 * $a02 + $b01 * $a12 + $b02 * $a22 + $b03 * $a32;
      $mat1[7] = $b00 * $a03 + $b01 * $a13 + $b02 * $a23 + $b03 * $a33;

      $b00 = $mat3[8]; $b01 = $mat3[9]; $b02 = $mat3[10]; $b03 = $mat3[11];
      $mat1[8] = $b00 * $a00 + $b01 * $a10 + $b02 * $a20 + $b03 * $a30;
      $mat1[9] = $b00 * $a01 + $b01 * $a11 + $b02 * $a21 + $b03 * $a31;
      $mat1[10] = $b00 * $a02 + $b01 * $a12 + $b02 * $a22 + $b03 * $a32;
      $mat1[11] = $b00 * $a03 + $b01 * $a13 + $b02 * $a23 + $b03 * $a33;

      $b00 = $mat3[12]; $b01 = $mat3[13]; $b02 = $mat3[14]; $b03 = $mat3[15];
      $mat1[12] = $b00 * $a00 + $b01 * $a10 + $b02 * $a20 + $b03 * $a30;
      $mat1[13] = $b00 * $a01 + $b01 * $a11 + $b02 * $a21 + $b03 * $a31;
      $mat1[14] = $b00 * $a02 + $b01 * $a12 + $b02 * $a22 + $b03 * $a32;
      $mat1[15] = $b00 * $a03 + $b01 * $a13 + $b02 * $a23 + $b03 * $a33;

    }, math, scope);

    math.mat4.copy = fin.macro(function mat4_copy(out$, a$) {
      $mat1 = out$;
      $mat2 = a$;

      $mat1[0] = $mat2[0];
      $mat1[1] = $mat2[1];
      $mat1[2] = $mat2[2];
      $mat1[3] = $mat2[3];
      $mat1[4] = $mat2[4];
      $mat1[5] = $mat2[5];
      $mat1[6] = $mat2[6];
      $mat1[7] = $mat2[7];
      $mat1[8] = $mat2[8];
      $mat1[9] = $mat2[9];
      $mat1[10] = $mat2[10];
      $mat1[11] = $mat2[11];
      $mat1[12] = $mat2[12];
      $mat1[13] = $mat2[13];
      $mat1[14] = $mat2[14];
      $mat1[15] = $mat2[15];
    }, math, scope);


    math.mat4.sd_vector = function (out, mat) {
      out[0] = mat[0];
      out[1] = mat[1];
      out[2] = mat[2];

    };

    math.mat4.up_vector = function (out, mat) {
      out[0] = mat[4];
      out[1] = mat[5];
      out[2] = mat[6];

    };

    math.mat4.fw_vector = function (out, mat) {
      out[0] = mat[8];
      out[1] = mat[9];
      out[2] = mat[10];

    };

    /*
     *  return {
        up: new Float32Array(mat.buffer, (4 * 4), 3),
        fw: new Float32Array(mat.buffer, (8 * 4), 3),
        sd: new Float32Array(mat.buffer, 0, 3)

      };
     0  1  2  3
     4  5  6  7
     8  9  10 11
     12 13 14 15     
     */ 

    math.mat4.from_mat3 = fin.macro(function mat4_from_mat3(out$, a$) {
      $mat1 = out$;
      $mat2 = a$;

      $mat1[0] = $mat2[0];
      $mat1[1] = $mat2[1];
      $mat1[2] = $mat2[2];

      $mat1[4] = $mat2[3];
      $mat1[5] = $mat2[4];
      $mat1[6] = $mat2[5];

      $mat1[8] = $mat2[6];
      $mat1[9] = $mat2[7];
      $mat1[10] = $mat2[8];

    }, math, scope);

    math.mat4.target_to = fin.macro(function mat4_target_to(out$, eye$, target$, up$) {
      $mat1 = out$;

      $A = eye$;
      $B = up$;
      $C = target$;

      $a00 = $A[0] - $C[0]; //z0
      $a01 = $A[1] - $C[1]; //z1
      $a02 = $A[2] - $C[2]; //z2

      $det = $a00 * $a00 + $a01 * $a01 + $a02 * $a02;
      if ($det > 0) {
        $det = 1 / Math.sqrt($det);
        $a00 *= $det;
        $a01 *= $det;
        $a02 *= $det;
      }

      
      $b00 = $B[1] * $a02 - $B[2] * $a01; //x0
      $b01 = $B[2] * $a00 - $B[0] * $a02; //x1
      $b02 = $B[0] * $a01 - $B[1] * $a00; //x2

      $det = $b00 * $b00 + $b01 * $b01 + $b02 * $b02;
      if ($det > 0) {
        $det = 1 / Math.sqrt($det);
        $b00 *= $det;
        $b01 *= $det;
        $b02 *= $det;
      }

      $mat1[0] = $b00;
      $mat1[1] = $b01;
      $mat1[2] = $b02;
      $mat1[3] = 0;
      $mat1[4] = $a01 * $b02 - $a02 * $b01;
      $mat1[5] = $a02 * $b00 - $a00 * $b02;
      $mat1[6] = $a00 * $b01 - $a01 * $b00;
      $mat1[7] = 0;
      $mat1[8] = $a00;
      $mat1[9] = $a01;
      $mat1[10] = $a02;
      $mat1[11] = 0;
      $mat1[12] = $A[0];
      $mat1[13] = $A[1];
      $mat1[14] = $A[2];
      $mat1[15] = 1;

    }, math, scope);


    math.mat4.get_scaling = function (out, mat) {
      out[0] = Math.hypot(mat[0], mat[1], mat[2]);
      out[1] = Math.hypot(mat[4], mat[5], mat[6]);
      out[2] = Math.hypot(mat[8], mat[9], mat[10]);
      return out;
    };

    math.mat4.get_translation = function (out, mat) {
      out[0] = mat[12];
      out[1] = mat[13];
      out[2] = mat[14];

      return out;
    };

    var v31 = math.vec3();

    var is1, is2, is3, sm11, sm12, sm13, sm21, sm22, sm23, sm31, sm32, sm33, trace,S;

    math.mat4.get_rotation = function (out, mat) {
      this.get_scaling(v31, mat);
      is1 = 1 / v31[0];
      is2 = 1 / v31[1];
      is3 = 1 / v31[2];

      sm11 = mat[0] * is1;
      sm12 = mat[1] * is2;
      sm13 = mat[2] * is3;
      sm21 = mat[4] * is1;
      sm22 = mat[5] * is2;
      sm23 = mat[6] * is3;
      sm31 = mat[8] * is1;
      sm32 = mat[9] * is2;
      sm33 = mat[10] * is3;

      trace = sm11 + sm22 + sm33;
      S = 0;
      if (trace > 0) {
        S = Math.sqrt(trace + 1.0) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
      } else if (sm22 > sm33) {
        S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
      } else {
        S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }

      return out;
    };


  }, "math.mat4");

  //aabb
  fin.macro_scope(function (scope, $i,  $j, $x, $y, $z) {
    math.aabb.set = fin.macro(function aabb_set(out$, minx$, miny$, minz$, maxx$, maxy$, maxz$) {
      out$[0] = minx$; out$[1] = miny$; out$[2] = minz$;
      out$[3] = maxx$; out$[4] = maxy$; out$[5] = maxz$;
    }, math, scope);

    math.aabb.transform_mat4 = fin.macro(function aabb_transform_mat4(out$, a$,m$) {

      for ($i = 0; $i < 3; $i++) {
        out$[$i] = m$[12 + $i];
        out$[$i + 3] = m$[12 + $i];
        for ($j = 0; $j < 3; $j++) {
          $z = m$[($j * 3 + $i) + $j];
          $x = $z * a$[$j];
          $y = $z * a$[$j + 3];
          if ($x < $y) {
            out$[$i] += $x;
            out$[$i + 3] += $y;
          }
          else {
            out$[$i] += $y;
            out$[$i + 3] += $x;
          }
        }
      }

    }, math, scope);



    math.aabb.decompose = fin.macro(function aabb_decompose(ab$, min$, max$) {
      min$[0] = ab$[0]
      min$[1] = ab$[1]
      min$[2] = ab$[2]

      max$[0] = ab$[3];
      max$[1] = ab$[4];
      max$[2] = ab$[5];
    }, math, scope);


    function $$AABB_DECOMPOSE(ab$, min$, max$) {
      min$[0] = ab$[0]
      min$[1] = ab$[1]
      min$[2] = ab$[2]

      max$[0] = ab$[3];
      max$[1] = ab$[4];
      max$[2] = ab$[5];
    }



  },"math.aabb");

  //quat
  fin.macro_scope(function (scope, $xUnitVec3, $yUnitVec3,$tmpvec3,$dot, $qX, $qY, $qZ, $qW, $dqX, $dqY, $dqZ, $dqW, $qLen, mat1$, $quat1, $quat2, $quat3, $cosom, $omega, $sinom, $scale0, $scale1) {

    math.quat.mult = fin.macro(function quat_mult(out$, a$, b$) {
      $quat1 = out$;
      $quat2 = a$;
      $quat3 = b$;


      $qX = $quat2[0]; $qY = $quat2[1]; $qZ = $quat2[2]; $qW = $quat2[3];

      $dqX = $quat3[0]; $dqY = $quat3[1]; $dqZ = $quat3[2]; $dqW = $quat3[3];

      $quat1[0] = $qX * $dqW + $qW * $dqX + $qY * $dqZ - $qZ * $dqY;
      $quat1[1] = $qY * $dqW + $qW * $dqY + $qZ * $dqX - $qX * $dqZ;
      $quat1[2] = $qZ * $dqW + $qW * $dqZ + $qX * $dqY - $qY * $dqX;
      $quat1[3] = $qW * $dqW - $qX * $dqX - $qY * $dqY - $qZ * $dqZ;

    }, math, scope);




    math.quat.copy = fin.macro(function quat_copy(out$, a$) {
      
      out$[0] = a$[0];out$[1] = a$[1];out$[2] = a$[2];out$[3] = a$[3];
    }, math, scope);


    math.quat.normalize = fin.macro(function quat_normalize(out$, a$) {
      $quat1 = out$;
      $quat2 = a$;

      $qX = $quat2[0]; $qY = $quat2[1]; $qZ = $quat2[2]; $qW = $quat2[3];
      $qLen = $qX * $qX + $qY * $qY + $qZ * $qZ + $qW * $qW;
      if ($qLen > 0) {
        $qLen = 1 / Math.sqrt($qLen);
      }
      $quat1[0] = $qX * $qLen;
      $quat1[1] = $qY * $qLen;
      $quat1[2] = $qZ * $qLen;
      $quat1[3] = $qW * $qLen;

    }, math, scope);


    math.quat.set_axis_angle = fin.macro(function quat_set_axis_angle(out$, a$,rad$) {
      $quat1 = out$;
      $qX = a$;

      $scale0 = rad$ * 0.5;
      $scale1 = Math.sin($scale0);
      $quat1[0] = $scale1 * $qX[0];
      $quat1[1] = $scale1 * $qX[1];
      $quat1[2] = $scale1 * $qX[2];
      $quat1[3] = Math.cos($scale0);


    }, math, scope);

    fin.macro(function quat_init_rotation_to(out$, a$, b$) {
      
      $tmpvec3 = [0, 0, 0]; $xUnitVec3 = [-1, 0, 0]; $yUnitVec3 = [0, 1, 0];



    }, math, scope);


    math.quat.rotation_to = fin.macro(function quat_rotation_to(out$, a$, b$) {
      $quat1 = out$;
      $quat2 = a$;
      $quat3 = b$;


      $dot = $quat2[0] * $quat3[0] + $quat2[1] * $quat3[1] + $quat2[2] * $quat3[2]

      if ($dot < -0.999999) {

        $tmpvec3[0] = $xUnitVec3[1] * $quat2[2] - $xUnitVec3[2] * $quat2[1];
        $tmpvec3[1] = $xUnitVec3[2] * $quat2[0] - $xUnitVec3[0] * $quat2[2];
        $tmpvec3[2] = $xUnitVec3[0] * $quat2[1] - $xUnitVec3[1] * $quat2[0];


        $qLen =
          math.vec3_length$($tmpvec3)

        if ($qLen < 0.000001) {
          math.vec3_cross$($tmpvec3, $yUnitVec3, $quat2)
        }

        math.vec3_normalize$($tmpvec3, $tmpvec3)


        $scale0 = Math.PI * 0.5;
        $scale1 = Math.sin($scale0);
        $quat1[0] = $scale1 * $tmpvec3[0];
        $quat1[1] = $scale1 * $tmpvec3[1];
        $quat1[2] = $scale1 * $tmpvec3[2];
        $quat1[3] = Math.cos($scale0);




      }
      else if ($dot > 0.999999) {
        $quat1[0] = 0;$quat1[1] = 0; $quat1[2] = 0; $quat1[3] = 1;

      }

      else {
        math.vec3_cross$($quat1, $quat2, $quat3)
        $quat1[3] = 1 + $dot;


        $qX = $quat1[0]; $qY = $quat1[1]; $qZ = $quat1[2]; $qW = $quat1[3];
        $qLen = $qX * $qX + $qY * $qY + $qZ * $qZ + $qW * $qW;
        if ($qLen > 0) {
          $qLen = 1 / Math.sqrt($qLen);
        }
        $quat1[0] = $qX * $qLen;
        $quat1[1] = $qY * $qLen;
        $quat1[2] = $qZ * $qLen;
        $quat1[3] = $qW * $qLen;

      }




    }, math, scope);

    math.quat.rotate_eular = fin.macro(function quat_rotate_eular(out$, x$, y$, z$) {
      $quat1 = out$;

      
      $qX = Math.sin(x$ * 0.5); $qY = Math.sin(y$ * 0.5); $qZ = Math.sin(z$ * 0.5);
      $dqX = Math.cos(x$ * 0.5); $dqY = Math.cos(y$ * 0.5); $dqZ = Math.cos(z$ * 0.5);



      $quat1[0] = $qX * $dqY * $dqZ - $dqX * $qY * $qZ;
      $quat1[1] = $dqX * $qY * $dqZ + $qX * $dqY * $qZ;
      $quat1[2] = $dqX * $dqY * $qZ - $qX * $qY * $dqZ;
      $quat1[3] = $dqX * $dqY * $dqZ + $qX * $qY * $qZ;


      $qX = $quat1[0]; $qY = $quat1[1]; $qZ = $quat1[2]; $qW = $quat1[3];
      $qLen = $qX * $qX + $qY * $qY + $qZ * $qZ + $qW * $qW;

      if ($qLen > 0) {
        $qLen = 1 / Math.sqrt($qLen);
      }

      $quat1[0] = $qX * $qLen;
      $quat1[1] = $qY * $qLen;
      $quat1[2] = $qZ * $qLen;
      $quat1[3] = $qW * $qLen;

    }, math, scope);

    math.quat.invert = fin.macro(function quat_invert(out$, a$) {
      $quat1 = out$;
      $quat2 = a$;

      $qX = $quat2[0]; $qY = $quat2[1]; $qZ = $quat2[2]; $qW = $quat2[3];
      $qLen = $qX * $qX + $qY * $qY + $qZ * $qZ + $qW * $qW;
      if ($qLen > 0) {
        $qLen = 1 / Math.sqrt($qLen);
      }
      $quat1[0] = -$qX * $qLen;
      $quat1[1] = -$qY * $qLen;
      $quat1[2] = -$qZ * $qLen;
      $quat1[3] = $qW * $qLen;
    }, math, scope);



    math.quat.slerp_flat = fin.macro(function quat_slerp_flat(out$, $qX, $qY, $qZ, $qW, $dqX, $dqY, $dqZ, $dqW,$t) {

      $cosom = $qX * $dqX + $qY * $dqY + $qZ * $dqZ + $qW * $dqW;

      if ($cosom < 0.0) {
        $cosom = -$cosom;
        $dqX = -$dqX;
        $dqY = -$dqY;
        $dqZ = -$dqZ;
        $dqW = -$dqW;
      }

      
      if (1.0 - $cosom > 0.000001) {

        $omega = Math.acos($cosom);
        $sinom = Math.sin($omega);
        $scale0 = Math.sin((1.0 - $t) * $omega) / $sinom;
        $scale1 = Math.sin($t * $omega) / $sinom;

      } else {       
        $scale0 = 1.0 - $t;
        $scale1 = $t;
      }


      out$[0] = $scale0 * $qX + $scale1 * $dqX;
      out$[1] = $scale0 * $qY + $scale1 * $dqY;
      out$[2] = $scale0 * $qZ + $scale1 * $dqZ;
      out$[3] = $scale0 * $qW + $scale1 * $dqW;


    }, math, scope);



  


    math.quat.from_vec3_float = fin.macro(function quat_from_vec3_float(out$, a$, f$) {
      out$[0] = a$[0];
      out$[1] = a$[1];
      out$[2] = a$[2];
      out$[3] = f$;
    }, math);


    math.quat.from_mat3 = fin.macro(function quat_from_mat3(out$, m$) {
      mat1$ = m$;
      $quat1 = out$;


      $dqX = mat1$[0];
      $dqY = mat1$[4];
      $dqZ = mat1$[8];
      $dqW= $dqX + $dqY + $dqZ;
      if ($dqW > 0) {
        $dqW = Math.sqrt($dqW + 1);
        quat1$[3] = 0.5 * $dqW;
        s = 0.5 / $dqW;
        quat1$[0] = (mat1$[7] - mat1$[5]) * $dqW;
        quat1$[1] = (mat1$[2] - mat1$[6]) * $dqW;
        quat1$[2] = (mat1$[3] - mat1$[1]) * $dqW;
      } else if ($dqX > $dqY) {
        if ($dqX > $dqZ) {
          $dqW = Math.sqrt($dqX - $dqY - $dqZ + 1);
          quat1$[0] = 0.5 * $dqW;
          $dqW = 0.5 / $dqW;
          quat1$[1] = (mat1$[1] + mat1$[3]) * $dqW;
          quat1$[2] = (mat1$[2] + mat1$[6]) * $dqW;
          quat1$[3] = (mat1$[7] - mat1$[5]) * $dqW;
        } else {
          $dqW = Math.sqrt(e22 - $dqX - $dqY + 1);
          quat1$[2] = 0.5 * $dqW;
          $dqW = 0.5 / $dqW;
          quat1$[0] = (mat1$[2] + mat1$[6]) * $dqW;
          quat1$[1] = (mat1$[5] + mat1$[7]) * $dqW;
          quat1$[3] = (mat1$[3] - mat1$[1]) * $dqW;
        }
      } else if ($dqY > $dqZ) {
        $dqW = Math.sqrt($dqY - $dqZ - $dqX + 1);
        quat1$[1] = 0.5 * $dqW;
        $dqW = 0.5 / $dqW;
        quat1$[0] = (mat1$[1] + mat1$[3]) * $dqW;
        quat1$[2] = (mat1$[5] + mat1$[7]) * $dqW;
        quat1$[3] = (mat1$[2] - mat1$[6]) * $dqW;
      } else {
        $dqW = Math.sqrt($dqZ - $dqX - $dqY + 1);
        quat1$[2] = 0.5 * $dqW;
        $dqW = 0.5 / $dqW;
        quat1$[0] = (mat1$[2] + mat1$[6]) * $dqW;
        quat1$[1] = (mat1$[5] + mat1$[7]) * $dqW;
        quat1$[3] = (mat1$[3] - mat1$[1]) * $dqW;
      }





    }, math);

    math.quat.up_vec3 = fin.macro(function quat_up_vec3(out$, q$) {

      $quat1 = out$;

      $qX = q$[0];
      $qY = q$[1];
      $qZ = q$[2];
      $qW = q$[3];


      $quat1[0] = (($qX * ($qY + $qY)) - ($qW * ($qZ + $qZ)));
      $quat1[1] = (1 - (($qX * ($qX + $qX)) + ($qZ * ($qZ + $qZ))));
      $quat1[2] = (($qY * ($qZ + $qZ)) + ($qW * ($qX + $qX)));


    }, math, scope);



  }, "math.quat");





  //dquat
  fin.macro_scope(function (scope, $dquat1, $dquat2, $dquat3, $ax0, $ay0, $az0, $aw0, $ax1, $ay1, $az1, $aw1, $bx0, $by0, $bz0, $bw0, $bx1, $by1, $bz1, $bw1, $qLen) {

    math.dquat.mult = fin.macro(function dquat_mult(out$, a$, b$) {
      $dquat1 = out$;
      $dquat2 = a$;
      $dquat3 = b$;

      $ax0 = $dquat2[0]; $ay0 = $dquat2[1]; $az0 = $dquat2[2]; $aw0 = $dquat2[3];
      $ax1 = $dquat2[4]; $ay1 = $dquat2[5]; $az1 = $dquat2[6]; $aw1 = $dquat2[7];

      $bx0 = $dquat3[0]; $by0 = $dquat3[1]; $bz0 = $dquat3[2]; $bw0 = $dquat3[3];
      $bx1 = $dquat3[4]; $by1 = $dquat3[5]; $bz1 = $dquat3[6]; $bw1 = $dquat3[7];

      $dquat1[0] = $ax0 * $bw0 + $aw0 * $bx0 + $ay0 * $bz0 - $az0 * $by0;
      $dquat1[1] = $ay0 * $bw0 + $aw0 * $by0 + $az0 * $bx0 - $ax0 * $bz0;
      $dquat1[2] = $az0 * $bw0 + $aw0 * $bz0 + $ax0 * $by0 - $ay0 * $bx0;
      $dquat1[3] = $aw0 * $bw0 - $ax0 * $bx0 - $ay0 * $by0 - $az0 * $bz0;

      $dquat1[4] = $ax0 * $bw1 + $aw0 * $bx1 + $ay0 * $bz1 - $az0 * $by1 + $ax1 * $bw0 + $aw1 * $bx0 + $ay1 * $bz0 - $az1 * $by0;
      $dquat1[5] = $ay0 * $bw1 + $aw0 * $by1 + $az0 * $bx1 - $ax0 * $bz1 + $ay1 * $bw0 + $aw1 * $by0 + $az1 * $bx0 - $ax1 * $bz0;
      $dquat1[6] = $az0 * $bw1 + $aw0 * $bz1 + $ax0 * $by1 - $ay0 * $bx1 + $az1 * $bw0 + $aw1 * $bz0 + $ax1 * $by0 - $ay1 * $bx0;
      $dquat1[7] = $aw0 * $bw1 - $ax0 * $bx1 - $ay0 * $by1 - $az0 * $bz1 + $aw1 * $bw0 - $ax1 * $bx0 - $ay1 * $by0 - $az1 * $bz0;


    }, math, scope);

    math.dquat.from_quat_pos = fin.macro(function dquat_from_quat_pos(out$, qt$, pos$) {
      $dquat1 = out$;

      $dquat1[0] = qt$[0];
      $dquat1[1] = qt$[1];
      $dquat1[2] = qt$[2];
      $dquat1[3] = qt$[3];

      $ax0 = pos$[0] * 0.5;
      $ay0 = pos$[1] * 0.5;
      $az0 = pos$[2] * 0.5;



      $bx0 = $dquat1[0];
      $by0 = $dquat1[1];
      $bz0 = $dquat1[2];
      $bw0 = $dquat1[3];



      $dquat1[4] = $ax0 * $bw0 + $ay0 * $bz0 - $az0 * $by0;
      $dquat1[5] = $ay0 * $bw0 + $az0 * $bx0 - $ax0 * $bz0;
      $dquat1[6] = $az0 * $bw0 + $ax0 * $by0 - $ay0 * $bx0;
      $dquat1[7] = -$ax0 * $bx0 - $ay0 * $by0 - $az0 * $bz0;

    }, math, scope);

    math.dquat.invert = fin.macro(function dquat_invert(out$, a$) {
      $dquat1 = out$;
      $dquat2 = a$;



      $ax0 = $dquat2[0]; $ay0 = $dquat2[1]; $az0 = $dquat2[2]; $aw0 = $dquat2[3];

      $qLen = $ax0 * $ax0 + $ay0 * $ay0 + $az0 * $az0 + $aw0 * $aw0;


      if ($qLen > 0) {
        $qLen = 1 / Math.sqrt($qLen);
      }
      $dquat1[0] = -$ax0 * $qLen;
      $dquat1[1] = -$ay0 * $qLen;
      $dquat1[2] = -$az0 * $qLen;
      $dquat1[3] = $aw0 * $qLen;
    }, math, scope);

    math.dquat.copy = fin.macro(function dquat_copy(out$, a$) {
      $dquat1 = out$;
      $dquat2 = a$;

      $dquat1[0] = $dquat2[0];
      $dquat1[1] = $dquat2[1];
      $dquat1[2] = $dquat2[2];
      $dquat1[3] = $dquat2[3];
      $dquat1[4] = $dquat2[4];
      $dquat1[5] = $dquat2[5];
      $dquat1[6] = $dquat2[6];
      $dquat1[7] = $dquat2[7];

    }, math, scope);


    var QT_1 = math.quat(), v3_1 = math.vec3();

    math.dquat.from_mat4 = function (out, mat) {
      math.mat4.get_rotation(QT_1, mat)
      math.mat4.get_translation(v3_1, mat);

      math.dquat.from_quat_pos(out, QT_1, v3_1);
      return out;
    };


    math.dquat.get_pos = fin.macro(function dquat_get_pos(out$, a$) {
      $dquat1 = out$;
      $dquat2 = a$;

      $ax0 = $dquat2[4];
      $ay0 = $dquat2[5];
      $az0 = $dquat2[6];
      $aw0 = $dquat2[7];
      $bx0 = -$dquat2[0];
      $by0 = -$dquat2[1];
      $bz0 = -$dquat2[2];
      $bw0 = $dquat2[3];

      $dquat1[0] = ($ax0 * $bw0 + $aw0 * $bx0 + $ay0 * $bz0 - $az0 * $by0) * 2;
      $dquat1[1] = ($ay0 * $bw0 + $aw0 * $by0 + $az0 * $bx0 - $ax0 * $bz0) * 2;
      $dquat1[2] = ($az0 * $bw0 + $aw0 * $bz0 + $ax0 * $by0 - $ay0 * $bx0) * 2;

    }, math, scope);


    math.dquat.get_translation = function (out, a) {


      $ax0 = a[4];
      $ay0 = a[5];
      $az0 = a[6];
      $aw0 = a[7];
      $bx0 = -a[0];
      $by0 = -a[1];
      $bz0 = -a[2];
      $bw0 = a[3];

      out[0] = ($ax0 * $bw0 + $aw0 * $bx0 + $ay0 * $bz0 - $az0 * $by0) * 2;
      out[1] = ($ay0 * $bw0 + $aw0 * $by0 + $az0 * $bx0 - $ax0 * $bz0) * 2;
      out[2] = ($az0 * $bw0 + $aw0 * $bz0 + $ax0 * $by0 - $ay0 * $bx0) * 2;
      return out;
    };


  }, "math.dquat");


  //utils
  fin.macro_scope(function (scope) {


    math.utils.ray_plane_intersection = function (out$, ray_start$, ray_end$, plane_pos$, plane_normal$) {

      var ray_len = math.vec3.pool.get();

      math.vec3.subtract(ray_len, ray_end$, ray_start$);

      var denom = math.vec3.dot(ray_len, plane_normal$);
      if (denom <= 0.000001 && denom >= -0.000001) return false;

      var ray2_plane_len = math.vec3.pool.get();

      math.vec3.subtract(ray2_plane_len, plane_pos$, ray_start$);
      denom = math.vec3.dot(ray2_plane_len, plane_normal$) / denom;


      math.vec3.pool.free(ray_len);
      math.vec3.pool.free(ray2_plane_len);

      if (denom >= 0) {
        math.vec3.scale_add(out$, ray_start$, ray_len, denom);
        return true;
      }
      return false;

    };



    math.utils.mat4_into_up_fw_sd = function (mat) {
      return {
        up: new Float32Array(mat.buffer, (4 * 4), 3),
        fw: new Float32Array(mat.buffer, (8 * 4), 3),
        sd: new Float32Array(mat.buffer, 0, 3)

      };
    }




  }, "math.utils");


}})().apply(_FM["math"],[_FM["fin"]]);
_FM["ge"]=new Object();
(function(){ return function index(ecs, math) {

  

  
  Object.assign(this,{"SHADING":{"FLAT":2,"SHADED":4,"POST_SHADING":8,"CAST_SHADOW":16,"RECEIVE_SHADOW":32,"RECEIVE_REFLECTION":64,"TRANSPARENT":128,"OPUQUE":256,"DEPTH_TEST":512,"NO_DEPTH_TEST":1024,"DOUBLE_SIDES":2048,"SHADOW_DOUBLE_SIDES":4096},"DISPLAY_ALWAYS":2,"ITEM_TYPES":{"MESH":4,"LIGHT":8,"CAMERA":16,"MANIPULATOR":32,"OTHER":1024},"PICKABLE_MESH":2048,"TRANS":{"SCALABLE":2,"ANIMATED":4,"ANIMATED_POSITION":8,"ANIMATED_SCALE":16,"ANIMATED_ROTATION":32,"IK_ANIMATED":64},"GL_ACTIVE_ATTRIBUTES":35721,"GL_ACTIVE_TEXTURE":34016,"GL_ACTIVE_UNIFORMS":35718,"GL_ALIASED_LINE_WIDTH_RANGE":33902,"GL_ALIASED_POINT_SIZE_RANGE":33901,"GL_ALPHA":6406,"GL_ALPHA_BITS":3413,"GL_ALWAYS":519,"GL_ARRAY_BUFFER":34962,"GL_ARRAY_BUFFER_BINDING":34964,"GL_ATTACHED_SHADERS":35717,"GL_BACK":1029,"GL_BLEND":3042,"GL_BLEND_COLOR":32773,"GL_BLEND_DST_ALPHA":32970,"GL_BLEND_DST_RGB":32968,"GL_BLEND_EQUATION":32777,"GL_BLEND_EQUATION_ALPHA":34877,"GL_BLEND_EQUATION_RGB":32777,"GL_BLEND_SRC_ALPHA":32971,"GL_BLEND_SRC_RGB":32969,"GL_BLUE_BITS":3412,"GL_BOOL":35670,"GL_BOOL_VEC2":35671,"GL_BOOL_VEC3":35672,"GL_BOOL_VEC4":35673,"GL_BROWSER_DEFAULT_WEBGL":37444,"GL_BUFFER_SIZE":34660,"GL_BUFFER_USAGE":34661,"GL_BYTE":5120,"GL_CCW":2305,"GL_CLAMP_TO_EDGE":33071,"GL_COLOR_ATTACHMENT0":36064,"GL_COLOR_BUFFER_BIT":16384,"GL_COLOR_CLEAR_VALUE":3106,"GL_COLOR_WRITEMASK":3107,"GL_COMPILE_STATUS":35713,"GL_COMPRESSED_TEXTURE_FORMATS":34467,"GL_CONSTANT_ALPHA":32771,"GL_CONSTANT_COLOR":32769,"GL_CONTEXT_LOST_WEBGL":37442,"GL_CULL_FACE":2884,"GL_CULL_FACE_MODE":2885,"GL_CURRENT_PROGRAM":35725,"GL_CURRENT_VERTEX_ATTRIB":34342,"GL_CW":2304,"GL_DECR":7683,"GL_DECR_WRAP":34056,"GL_DELETE_STATUS":35712,"GL_DEPTH_ATTACHMENT":36096,"GL_DEPTH_BITS":3414,"GL_DEPTH_BUFFER_BIT":256,"GL_DEPTH_CLEAR_VALUE":2931,"GL_DEPTH_COMPONENT":6402,"GL_DEPTH_COMPONENT16":33189,"GL_DEPTH_FUNC":2932,"GL_DEPTH_RANGE":2928,"GL_DEPTH_STENCIL":34041,"GL_DEPTH_STENCIL_ATTACHMENT":33306,"GL_DEPTH_TEST":2929,"GL_DEPTH_WRITEMASK":2930,"GL_DITHER":3024,"GL_DONT_CARE":4352,"GL_DST_ALPHA":772,"GL_DST_COLOR":774,"GL_DYNAMIC_DRAW":35048,"GL_ELEMENT_ARRAY_BUFFER":34963,"GL_ELEMENT_ARRAY_BUFFER_BINDING":34965,"GL_EQUAL":514,"GL_FASTEST":4353,"GL_FLOAT":5126,"GL_FLOAT_MAT2":35674,"GL_FLOAT_MAT3":35675,"GL_FLOAT_MAT4":35676,"GL_FLOAT_VEC2":35664,"GL_FLOAT_VEC3":35665,"GL_FLOAT_VEC4":35666,"GL_FRAGMENT_SHADER":35632,"GL_FRAMEBUFFER":36160,"GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME":36049,"GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE":36048,"GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE":36051,"GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL":36050,"GL_FRAMEBUFFER_BINDING":36006,"GL_FRAMEBUFFER_COMPLETE":36053,"GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT":36054,"GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS":36057,"GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT":36055,"GL_FRAMEBUFFER_UNSUPPORTED":36061,"GL_FRONT":1028,"GL_FRONT_AND_BACK":1032,"GL_FRONT_FACE":2886,"GL_FUNC_ADD":32774,"GL_FUNC_REVERSE_SUBTRACT":32779,"GL_FUNC_SUBTRACT":32778,"GL_GENERATE_MIPMAP_HINT":33170,"GL_GEQUAL":518,"GL_GREATER":516,"GL_GREEN_BITS":3411,"GL_HIGH_FLOAT":36338,"GL_HIGH_INT":36341,"GL_IMPLEMENTATION_COLOR_READ_FORMAT":35739,"GL_IMPLEMENTATION_COLOR_READ_TYPE":35738,"GL_INCR":7682,"GL_INCR_WRAP":34055,"GL_INT":5124,"GL_INT_VEC2":35667,"GL_INT_VEC3":35668,"GL_INT_VEC4":35669,"GL_INVALID_ENUM":1280,"GL_INVALID_FRAMEBUFFER_OPERATION":1286,"GL_INVALID_OPERATION":1282,"GL_INVALID_VALUE":1281,"GL_INVERT":5386,"GL_KEEP":7680,"GL_LEQUAL":515,"GL_LESS":513,"GL_LINEAR":9729,"GL_LINEAR_MIPMAP_LINEAR":9987,"GL_LINEAR_MIPMAP_NEAREST":9985,"GL_LINES":1,"GL_LINE_LOOP":2,"GL_LINE_STRIP":3,"GL_LINE_WIDTH":2849,"GL_LINK_STATUS":35714,"GL_LOW_FLOAT":36336,"GL_LOW_INT":36339,"GL_LUMINANCE":6409,"GL_LUMINANCE_ALPHA":6410,"GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS":35661,"GL_MAX_CUBE_MAP_TEXTURE_SIZE":34076,"GL_MAX_FRAGMENT_UNIFORM_VECTORS":36349,"GL_MAX_RENDERBUFFER_SIZE":34024,"GL_MAX_TEXTURE_IMAGE_UNITS":34930,"GL_MAX_TEXTURE_SIZE":3379,"GL_MAX_VARYING_VECTORS":36348,"GL_MAX_VERTEX_ATTRIBS":34921,"GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS":35660,"GL_MAX_VERTEX_UNIFORM_VECTORS":36347,"GL_MAX_VIEWPORT_DIMS":3386,"GL_MEDIUM_FLOAT":36337,"GL_MEDIUM_INT":36340,"GL_MIRRORED_REPEAT":33648,"GL_NEAREST":9728,"GL_NEAREST_MIPMAP_LINEAR":9986,"GL_NEAREST_MIPMAP_NEAREST":9984,"GL_NEVER":512,"GL_NICEST":4354,"GL_NONE":0,"GL_NOTEQUAL":517,"GL_NO_ERROR":0,"GL_ONE":1,"GL_ONE_MINUS_CONSTANT_ALPHA":32772,"GL_ONE_MINUS_CONSTANT_COLOR":32770,"GL_ONE_MINUS_DST_ALPHA":773,"GL_ONE_MINUS_DST_COLOR":775,"GL_ONE_MINUS_SRC_ALPHA":771,"GL_ONE_MINUS_SRC_COLOR":769,"GL_OUT_OF_MEMORY":1285,"GL_PACK_ALIGNMENT":3333,"GL_POINTS":0,"GL_POLYGON_OFFSET_FACTOR":32824,"GL_POLYGON_OFFSET_FILL":32823,"GL_POLYGON_OFFSET_UNITS":10752,"GL_RED_BITS":3410,"GL_RENDERBUFFER":36161,"GL_RENDERBUFFER_ALPHA_SIZE":36179,"GL_RENDERBUFFER_BINDING":36007,"GL_RENDERBUFFER_BLUE_SIZE":36178,"GL_RENDERBUFFER_DEPTH_SIZE":36180,"GL_RENDERBUFFER_GREEN_SIZE":36177,"GL_RENDERBUFFER_HEIGHT":36163,"GL_RENDERBUFFER_INTERNAL_FORMAT":36164,"GL_RENDERBUFFER_RED_SIZE":36176,"GL_RENDERBUFFER_STENCIL_SIZE":36181,"GL_RENDERBUFFER_WIDTH":36162,"GL_RENDERER":7937,"GL_REPEAT":10497,"GL_REPLACE":7681,"GL_RGB":6407,"GL_RGB5_A1":32855,"GL_RGB565":36194,"GL_RGBA":6408,"GL_RGBA4":32854,"GL_SAMPLER_2D":35678,"GL_SAMPLER_CUBE":35680,"GL_SAMPLES":32937,"GL_SAMPLE_ALPHA_TO_COVERAGE":32926,"GL_SAMPLE_BUFFERS":32936,"GL_SAMPLE_COVERAGE":32928,"GL_SAMPLE_COVERAGE_INVERT":32939,"GL_SAMPLE_COVERAGE_VALUE":32938,"GL_SCISSOR_BOX":3088,"GL_SCISSOR_TEST":3089,"GL_SHADER_TYPE":35663,"GL_SHADING_LANGUAGE_VERSION":35724,"GL_SHORT":5122,"GL_SRC_ALPHA":770,"GL_SRC_ALPHA_SATURATE":776,"GL_SRC_COLOR":768,"GL_STATIC_DRAW":35044,"GL_STENCIL_ATTACHMENT":36128,"GL_STENCIL_BACK_FAIL":34817,"GL_STENCIL_BACK_FUNC":34816,"GL_STENCIL_BACK_PASS_DEPTH_FAIL":34818,"GL_STENCIL_BACK_PASS_DEPTH_PASS":34819,"GL_STENCIL_BACK_REF":36003,"GL_STENCIL_BACK_VALUE_MASK":36004,"GL_STENCIL_BACK_WRITEMASK":36005,"GL_STENCIL_BITS":3415,"GL_STENCIL_BUFFER_BIT":1024,"GL_STENCIL_CLEAR_VALUE":2961,"GL_STENCIL_FAIL":2964,"GL_STENCIL_FUNC":2962,"GL_STENCIL_INDEX8":36168,"GL_STENCIL_PASS_DEPTH_FAIL":2965,"GL_STENCIL_PASS_DEPTH_PASS":2966,"GL_STENCIL_REF":2967,"GL_STENCIL_TEST":2960,"GL_STENCIL_VALUE_MASK":2963,"GL_STENCIL_WRITEMASK":2968,"GL_STREAM_DRAW":35040,"GL_SUBPIXEL_BITS":3408,"GL_TEXTURE":5890,"GL_TEXTURE0":33984,"GL_TEXTURE1":33985,"GL_TEXTURE2":33986,"GL_TEXTURE3":33987,"GL_TEXTURE4":33988,"GL_TEXTURE5":33989,"GL_TEXTURE6":33990,"GL_TEXTURE7":33991,"GL_TEXTURE8":33992,"GL_TEXTURE9":33993,"GL_TEXTURE10":33994,"GL_TEXTURE11":33995,"GL_TEXTURE12":33996,"GL_TEXTURE13":33997,"GL_TEXTURE14":33998,"GL_TEXTURE15":33999,"GL_TEXTURE16":34000,"GL_TEXTURE17":34001,"GL_TEXTURE18":34002,"GL_TEXTURE19":34003,"GL_TEXTURE20":34004,"GL_TEXTURE21":34005,"GL_TEXTURE22":34006,"GL_TEXTURE23":34007,"GL_TEXTURE24":34008,"GL_TEXTURE25":34009,"GL_TEXTURE26":34010,"GL_TEXTURE27":34011,"GL_TEXTURE28":34012,"GL_TEXTURE29":34013,"GL_TEXTURE30":34014,"GL_TEXTURE31":34015,"GL_TEXTURE_2D":3553,"GL_TEXTURE_BINDING_2D":32873,"GL_TEXTURE_BINDING_CUBE_MAP":34068,"GL_TEXTURE_CUBE_MAP":34067,"GL_TEXTURE_CUBE_MAP_NEGATIVE_X":34070,"GL_TEXTURE_CUBE_MAP_NEGATIVE_Y":34072,"GL_TEXTURE_CUBE_MAP_NEGATIVE_Z":34074,"GL_TEXTURE_CUBE_MAP_POSITIVE_X":34069,"GL_TEXTURE_CUBE_MAP_POSITIVE_Y":34071,"GL_TEXTURE_CUBE_MAP_POSITIVE_Z":34073,"GL_TEXTURE_MAG_FILTER":10240,"GL_TEXTURE_MIN_FILTER":10241,"GL_TEXTURE_WRAP_S":10242,"GL_TEXTURE_WRAP_T":10243,"GL_TRIANGLES":4,"GL_TRIANGLE_FAN":6,"GL_TRIANGLE_STRIP":5,"GL_UNPACK_ALIGNMENT":3317,"GL_UNPACK_COLORSPACE_CONVERSION_WEBGL":37443,"GL_UNPACK_FLIP_Y_WEBGL":37440,"GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL":37441,"GL_UNSIGNED_BYTE":5121,"GL_UNSIGNED_INT":5125,"GL_UNSIGNED_SHORT":5123,"GL_UNSIGNED_SHORT_4_4_4_4":32819,"GL_UNSIGNED_SHORT_5_5_5_1":32820,"GL_UNSIGNED_SHORT_5_6_5":33635,"GL_VALIDATE_STATUS":35715,"GL_VENDOR":7936,"GL_VERSION":7938,"GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING":34975,"GL_VERTEX_ATTRIB_ARRAY_ENABLED":34338,"GL_VERTEX_ATTRIB_ARRAY_NORMALIZED":34922,"GL_VERTEX_ATTRIB_ARRAY_POINTER":34373,"GL_VERTEX_ATTRIB_ARRAY_SIZE":34339,"GL_VERTEX_ATTRIB_ARRAY_STRIDE":34340,"GL_VERTEX_ATTRIB_ARRAY_TYPE":34341,"GL_VERTEX_SHADER":35633,"GL_VIEWPORT":2978,"GL_ZERO":0});
  
  this.module_export_code = function () {

    this.byte_code = this.byte_code.replace("/*STR_CONSTANTS*/", 'Object.assign(this,' + this.str_constants+');');
   
  }
}})().apply(_FM["ge"],[_FM["ecs"],_FM["math"]]);
(function() { return function index(fin,ecs, ge,math) { 

  ge.define = fin.define;
  ge.guidi = fin.guidi;




  ge.str = function (str, arg1, arg2, arg3, arg4, arg5) {
    str = "var arr=[];arr.push('" + str
      .replace(/\n/g, "\\n")
      .replace(/[\r\t]/g, " ")
      .split("<?").join("\t")
      .replace(/((^|\?>)[^\t]*)'/g, "$1\r")
      .replace(/\t=(.*?)\?>/g, "',$1,'")
      .split("\t").join("');")
      .split("?>").join("arr.push('")
      .split("\r").join("\\'")
      + "');return arr.join('');";
    return new Function(arg1, arg2, arg3, arg4, arg5, str);
  }


  ge.create_canvas = function (w, h) {
    var temp_canvas = document.createElement('canvas');
    temp_canvas.ctx = temp_canvas.getContext('2d');
    temp_canvas.width = w;
    temp_canvas.height = h;
    temp_canvas.set_size = function (ww, hh) {
      this.width = ww;
      this.height = hh;
    };
    temp_canvas._get_image_data = function () {
      this.imd = this.ctx.getImageData(0, 0, this.width, this.height);
      return this.imd;
    };

    temp_canvas._put_image_data = function () {
      this.ctx.putImageData(this.imd, 0, 0);
    };

    return (temp_canvas);
  };


  ge.mouse_events = function (elm, cb) {
    
    elm.addEventListener('mousedown', function (e) {
      elm.bound_rect = elm.bound_rect || elm.getBoundingClientRect();
      elm.mouse_x = e.clientX - elm.bound_rect.left;
      elm.mouse_y = e.clientY - elm.bound_rect.top; 
      elm.mouse_button = e.buttons;
      cb(elm, "mousedown", elm.mouse_x, elm.mouse_y, e);

    });
   
    elm.addEventListener('mouseup', function (e) {
      elm.mouse_button = e.buttons;
      cb(elm, "mouseup", elm.mouse_x, elm.mouse_y, e);

    });

    elm.addEventListener('mousemove', function (e) {
      elm.bound_rect = elm.bound_rect || elm.getBoundingClientRect();
      elm.mouse_x = e.clientX - elm.bound_rect.left;
      elm.mouse_y = e.clientY - elm.bound_rect.top;
      elm.mouse_button = e.buttons;
      cb(elm, "mousemove", elm.mouse_x, elm.mouse_y, e);

    });



  }

  ge.event = ge.define(function (proto) {
    proto.add = function (cb, callee) {
      callee = callee || this.owner;
      this.handlers[this.handlers.length] = [cb, callee];
    };    
    proto.trigger = function (params) {
      for (var i = 0; i < this.handlers.length; i++)
        if (this.handlers[i][0].apply(this.handlers[i][1], params) === false) return false;
    };

    proto.trigger_params = function () {
      for (var i = 0; i < this.handlers.length; i++)
        if (this.handlers[i][0].apply(this.handlers[i][1], this.params) === false) return false;
    };

    return function event(owner, params) {
      this.owner = owner;
      this.handlers = [];
      this.params = params;
    };
  });

  ge.flags_setting = ge.define(function (proto) {

    ge.set_flag = function (flags, flag) {
      if (!(flags & flag)) {
        flags |= flag;
      }
      return flags;
    };

    ge.unset_flag = function (flags, flag) {
      if ((flags & flag) !== 0) {
        flags &= ~flag;
      }
      return flags;
    };

    proto.set_flag = function (flag) {
      if (!(this.flags & flag)) {
        this.flags |= flag;
      }
      return (this);
    };

    proto.unset_flag = function (flag) {
      if ((this.flags & flag) !== 0) {
        this.flags &= ~flag;
      }
      return (this);
    };
    return function flags_setting() {
      this.flags = 0;
    }

  });


  ge.bulk_image_loader = ge.define(function (proto) {


    var dummy_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=";

    proto.load = function (url, params) {
      var img = this.pool.get();      
      if (img === null) {
        this.park.enqueue([url, params]);
        return;
      }
      img.params = params;
      img.manager = this;   
      img.src = url;
    };

   
    proto.check_park = function () {
      if (this.park.size() > 0) {
        this.load.apply(this, this.park.dequeue());
      }
    };

    proto.free = function (img) {
      this.pool.free(img);
      img.params = undefined;
      img.manager = undefined;
      img.src = dummy_image;
      this.check_park();
    };


    return function (pool_size) {
      this.park = new fin.queue();
      this.pool = new fin.object_pooler(function () {
        if (this.allocated <= this.max_size) {
          var img = new Image();          
          img.crossOrigin = "Anonymous";
          img.onload = function () {
            if (!this.manager) return;
            this.manager.onload(this, this.params);
          
            if (this.manager.auto_free) this.manager.free(this);
          };
          return img
        }
        this.allocated--;
        return null;        
      });
      this.pool.max_size = pool_size;    
      this.auto_free = true;
      return this;
    }




  });



  ge.load_working_image = (function () {
    var parking = new fin.queue();
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.is_busy = false;

    function process(url, cb) {
      if (img.is_busy) {
        parking.enqueue([url, cb]);
        return;
      }
      img.onload = function () {
        if (cb) cb(this);
        this.is_busy = false;
        if (parking.size() > 0) {
          process.apply(this, parking.dequeue());
        }
      };
      img.is_busy = true;
      img.src = url;

    }

    return process;

  })();


  ge.load_working_image_data = (function () {
    var parking = new fin.queue();
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.is_busy = false;
    var canv = ge.create_canvas(1, 1);




    function process(url, cb, w, h) {
      if (img.is_busy) {
        parking.enqueue([url, cb, w, h]);
        return;
      }
      img.onload = function () {
        canv.set_size(w || this.width, h || this.height);
        canv.ctx.drawImage(this, 0, 0, canv.width, canv.height);
        if (cb) cb(canv._get_image_data().data, canv.width, canv.height, this);
        canv._put_image_data();
        this.is_busy = false;
        if (parking.size() > 0) {
          process.apply(this, parking.dequeue());
        }
      };
      img.is_busy = true;
      img.src = url;

    }

    return process;

  })();





  ge.array = fin.array;


  ;


  ge.renderable = ge.define(function (proto, _super) {

    proto.expand_bounds = function (x, y, z) {
      this.bounds[0] = Math.min(this.bounds[0], x);
      this.bounds[1] = Math.min(this.bounds[1], y);
      this.bounds[2] = Math.min(this.bounds[2], z);

      this.bounds[3] = Math.max(this.bounds[3], x);
      this.bounds[4] = Math.max(this.bounds[4], y);
      this.bounds[5] = Math.max(this.bounds[5], z);
    };
    proto.initialize_item = function () {

    };
    proto.update_bounds = function (mat) { };

    proto.update_world_transform = function (position_world, scale_world, rotation_world) {
      math.mat4.from_quat(this.matrix_world, rotation_world);

      math.mat4.scale(this.matrix_world, scale_world);

      this.matrix_world[12] = position_world[0];
      this.matrix_world[13] = position_world[1];
      this.matrix_world[14] = position_world[2];


    };
    function ge_renderable(def) {
      this.matrix_world = math.mat4();
      this.world_position = new Float32Array(this.matrix_world.buffer, (12 * 4), 3);
      this.view_position = math.vec3();

      this.fw_vector = new Float32Array(this.matrix_world.buffer, (8 * 4), 3);
      this.bounds = math.aabb();
      this.item_type = 1024;
      this.flags = 0;
      this.require_update = 0;
      this.user_data = {};
    }

    return ge_renderable;
  });


  
  ge.utils = {};

  ge.utils.timers =( function () {

    var all_timers = [], i = 0, tim = null, now_time = 0;
    var timers = new fin.object_pooler(function () {
      all_timers.push({});
      return all_timers[all_timers.length - 1];
    });



    function tick() {

      now_time = Date.now();
      for (i = 0; i < all_timers.length; i++) {
        tim = all_timers[i];
        if (tim.cb) {
          if (now_time - tim.last_time > tim.interval) {
            tim.last_time = now_time;
            tim.cb(now_time - tim.begin_time, now_time);
          }
        }
      }

      setTimeout(tick, 100);

    }

    tick();
    
    return {
      create: function (cb, interval) {
        interval = interval || 1000;
        var tim = timers.get();
        tim.cb = cb;
        tim.interval = interval;
        tim.last_time = Date.now() - interval;
        tim.begin_time = tim.last_time + interval;

        return tim;

      },
      release: function (tim) {
        tim.cb = undefined;
        timers.free(tim);        
      }

    }


  })()


  ge.utils.canvas_data_url = (function () {

    var canv = new ge.create_canvas(1,1)
    function canvas_data_url (width, height, cb) {
      canv.set_size(width, height);
      return cb(canv,canv.ctx);
    }
    canvas_data_url.box = function (width, height, color) {
      canv.set_size(width, height);
      canv.ctx.fillStyle = color;
      canv.ctx.fillRect(0, 0, width, height);
      return canv.toDataURL("image/png");

    }
    return canvas_data_url;

  })();

  ge.app = ge.define(function (proto, _super) {

    proto.create_renderable = function (item, cb) {
      var e = this.create_entity({
        components: {
          'transform': {},
          'ge_renderable': {
            items: [item]
          },
        }
      });
      item.entity_id = e.uuid;
      cb(e.ge_renderable.items[0], e);

      return e;
    }

    proto.create_renderables = function (items, cb) {
      var e = this.create_entity({
        components: {
          'transform': {},
          'ge_renderable': {
            items: items
          },
        }
      });
      if (cb) {
        e.ge_renderable.items.forEach(function (item, i) {
          item.entity_id = e.uuid;
          cb(item, e);
        });

      }
     

      return e;
    }

    proto.start = (function (_super) {

      return function (cb, step_size) {
        var self = this;

        _super.apply(this, [function () {
     
          this.on_frame.trigger();
          cb();
          if (self.timer - self.last_debug_timer > 0.2) {
            self.last_debug_timer = self.timer;
            if (self.show_debug) self.display_debug(self.debug_ctx);
          }
        }, step_size]);
      
      }

    })(proto.start);

    proto.display_debug = function (ctx) {
      ctx.clearRect(0, 0, this.debug_canvas.width, this.debug_canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(this.render_system.fps + " FPS", 2, 10);
      
      for (var i = 0; i < this._systems.length; i++) { 
        ctx.fillText(this._systems[i].name_id + ' ' + this._systems[i].frame_time + ' ms ' + this._systems[i].status_text, 1, (i * 10) + 25);

      }

    }


    return function ge_app(def) {
      def = def || {};
      _super.apply(this, arguments);
      def.host = def.host || (function () {
        document.body.style.height = "100vh";
        document.body.style.width = "100%";
        document.body.style.padding = "0";
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";

        return document.body;

      })();

      this.use_system('ge_render_system', {
        host: def.host,
        renderer: def.renderer
      });

      this.root = this.create_entity({
        components: {
          'transform': {},
          'ge_renderable': {items: []},
        },
      });

      this.show_debug = def.show_debug || true;
      this.on_frame = new ge.event(this);

      this.last_debug_timer = 0;
      this.debug_canvas = ge.create_canvas(1, 1);
      this.debug_canvas.setAttribute("style", "position:absolute;width:100%;height:100%;left:0;top:0;box-sizing: border-box;pointer-events: none;");
      this.debug_ctx = this.debug_canvas.ctx;

      this.render_system = this.systems['ge_render_system']
      this.render_system.host.appendChild(this.debug_canvas);

     


      var self = this;

      this.all_timers = [];
      this.timers = new fin.object_pooler(function () {
        var timer = {
          cb: undefined,
          interval: 0,
          created: 0,
          lastClock: 0
        };
        this.all_timers.push(timer);
        return timer;

      });

      this.render_system.renderer.on_canvas_size = function (width, height) {
        self.debug_canvas.set_size(width * 0.75, height * 0.75);
      }


    }


  }, ecs.app);

}})()(_FM["fin"],_FM["ecs"],_FM["ge"],_FM["math"]);
(function() { return function webgl(fin,ge) {

  ge.webgl = {};

  ge.webgl.texture = ge.define(function (proto) {
    
    proto.enable_linear_interpolation = function () {
      this.parameters[10240] = 9729;
      this.parameters[10241] = 9729;

    };

    proto.enable_nearest_interpolation = function () {
      this.parameters[10240] = 9728;
      this.parameters[10241] = 9728;

    };

    proto.enable_clamp_to_edge = function () {
      this.parameters[10242] = 33071;
    this.parameters[10243] = 33071;

    };

   


    function texture(target, format, format_type, source, generate_mipmap, width, height) {

      this.uuid = fin.guidi();
      this.gl_texture = null;

      this.needs_update = false;
      if (source === undefined) {
        this.source = new Uint8Array([255, 255, 255, 255]);
        this.needs_update = true;
      }
      else {
        this.source = source;
      }
      this.width = width || 1;
      this.height = height || 1;


      this.last_used_time = 0;
      this.format = format || 6408;
      this.format_type = format_type || 5121;
      this.target = target || 3553;
      this.parameters = {};

      this.generate_mipmap = generate_mipmap || false;

      this.parameters[10242] = 10497;
      this.parameters[10243] = 10497;


      if (this.generate_mipmap) {
        this.parameters[10240] = 9729;
        this.parameters[10241] = 9987;
      }
      else {
        this.parameters[10240] = 9728;
        this.parameters[10241] = 9728;
      }
      if (this.source && this.source !== null) this.needs_update = true;


    }


    texture.load_images = new ge.bulk_image_loader(20);
    texture.load_images.auto_free = false;

    console.log(texture.load_images);  

    texture.load_images.onload = (function () {
      var canv = ge.create_canvas(1, 1);
      return function (img, tex) {


        if (tex.fit_size) {
          canv.set_size(tex.fit_size, tex.fit_size);
          canv.ctx.drawImage(img, 0, 0, tex.fit_size, tex.fit_size);
          tex.source = canv._get_image_data().data;
          tex.width = tex.fit_size;
          tex.height = tex.fit_size;
          texture.load_images.free(img);
        }
        else {
          tex.source = img;
          tex.width = img.width;
          tex.height = img.height;
        }

        tex.needs_update = true;

      }
    })();


    proto.free_source = function () {
      if (this.source === null) return;
      if (this.source.src) texture.load_images.free(this.source);
      this.source = null;
    }

    texture.update_from_url = function (tex, url) {
      texture.load_images.load(url, tex);
      return tex;
    }
    texture.from_url = function (url, generate_mipmap, fit_size) {
      var tex = new ge.webgl.texture(undefined, undefined, undefined, null, generate_mipmap);
      tex.fit_size = fit_size;
      texture.load_images.load(url, tex);
      return tex;
    }
   
    texture.from_size = function (width, height) {
      return new ge.webgl.texture(false, false, false, null, false, width, height);
    }

    texture.create_tiled_texture = (function () {
      var canv = ge.create_canvas(1, 1);
      canv.is_busy = false;
      var tile_maker = ge.create_canvas(1, 1);
      var x = 0, y = 0, tx = 0, ty = 0, input = null;
      var pool = [];
      tile_maker.ctx.imageSmoothingEnabled = false;

      canv.ctx.imageSmoothingEnabled = false;
      function create_tiled_texture(tile_urls, tile_size, width, height, texture) {
        texture = texture || new ge.webgl.texture(false, false, false, null, true, width, height);



        texture.tile_size = tile_size;
        if (canv.is_busy) {
          pool.push([tile_urls, tile_size, width, height, texture]);
          return texture;
        }
        canv.is_busy = true;
        canv.set_size(width, height);
        tile_maker.set_size(tile_size, tile_size);



        var tile_size2 = tile_size / 2;
        texture.tile_offset = tile_size / 4;
        texture.tile_offsetf = texture.tile_offset / width;
        texture.tile_sizef = tile_size / width;

        x = 0; y = 0;
        fin.each_index(function (index, next) {
          //console.log("loading ", tile_urls[index]);

          ge.load_working_image(tile_urls[index], function (img) {

            tile_maker.ctx.drawImage(img, 0, 0, tile_size2, tile_size2);
            tile_maker.ctx.drawImage(img, tile_size2, 0, tile_size2, tile_size2);

            tile_maker.ctx.drawImage(img, 0, tile_size2, tile_size2, tile_size2);

            tile_maker.ctx.drawImage(img, tile_size2, tile_size2, tile_size2, tile_size2);




            canv.ctx.drawImage(tile_maker, x, y, tile_size, tile_size);
            if (x + tile_size < width) {
              x += tile_size;
            }
            else {
              x = 0;
              y += tile_size;
            }
            //console.log("tile " + index);
            if (index < tile_urls.length - 1) {
              next(index + 1);
            }
            else {
              texture.source = canv._get_image_data().data;
              texture.needs_update = true;
              canv.is_busy = false;
              if (pool.length > 0) {
                create_tiled_texture.apply(ge.webgl.texture, pool.shift());
              }

              //canv.toBlob(function (b) {saveAs(b, "image.jpg");});
              //document.getElementById("test_tile").src = canv.toDataURL("");
            }
          }, tile_size, tile_size);
        }, 0);

        return texture;
      }

      texture.create_texture_atlas = function (def, texture) {
        texture = texture || new ge.webgl.texture(false, false, false, null, true, def.width, def.height);

        if (canv.is_busy) {
          pool.push([def, texture]);
          return texture;
        }
        canv.is_busy = true;
        canv.set_size(def.width, def.height);

        fin.each_index(function (index, next) {
          input = def.inputs[index];

          ge.load_working_image(input.src, function (img) {
            if (input.tiles_in_row) {
              input.tile_size = img.width / input.tiles_in_row;
              input.tile_width = input.tile_size;
              input.tile_height = input.tile_size;
            }
            tx = 0; ty = 0;
            if (input.rotation_sprites) {
              canv.ctx.strokeStyle = "green";
              var asize = 6.283185 / input.rotation_sprites;
              var an = 0;
              while (an <= 6.283185) {
                canv.ctx.save();
                canv.ctx.translate((input.dest_x + tx) + input.dest_size * 0.5, (input.dest_y + ty) + input.dest_size * 0.5);
                canv.ctx.rotate(an);
                //canv.ctx.drawImage(img, input.dest_x + tx, input.dest_y + ty, input.dest_size, input.dest_size);

                //canv.ctx.drawImage(img, -img.width / 2, -img.height / 2, input.dest_size, input.dest_size);

                canv.ctx.drawImage(img, -input.dest_size * 0.5, -input.dest_size * 0.5, input.dest_size, input.dest_size);



                canv.ctx.restore();
              //  canv.ctx.strokeRect(input.dest_x + tx, input.dest_y + ty, input.dest_size, input.dest_size);

                tx += input.dest_size;
                an += asize;
              }
            }
            else {
              for (y = 0; y < img.height; y += input.tile_height) {
                for (x = 0; x < img.width; x += input.tile_width) {
                  canv.ctx.drawImage(img, x, y,
                    input.tile_width,
                    input.tile_height,
                    input.dest_x + tx,
                    input.dest_y + ty,
                    input.dest_size,
                    input.dest_size);
                  tx += input.dest_size;
                  if (input.dest_per_row) {
                    if ((tx / input.dest_size) >= input.dest_per_row) {
                      tx = 0;
                      ty += input.dest_size;
                    }
                  }
                }
              }
            }
            

            if (index < def.inputs.length - 1) {
              next(index + 1);
            }
            else {
              texture.source = canv._get_image_data().data;
              texture.needs_update = true;
              canv.is_busy = false;
              if (document.getElementById("test_texture_atlas")) {
                document.getElementById("test_texture_atlas").src = canv.toDataURL("");
              }
            

              if (pool.length > 0) {
                create_tiled_texture.apply(ge.webgl.texture, pool.shift());
              }
            }
          });



        }, 0);

        return texture;

      }


      return create_tiled_texture;
    })();

    texture.pooler = fin.define(function (proto) {
      proto.get = function (url) {
        return this.pool.get(url);
      };
      proto.free = function (tex) {
        tex.valid_id = -100;
        tex.free_source();
        this.pool.free(tex);
      };

      proto.valid_texture = function (tex, valid_id) {

        if (tex && valid_id) {
          return tex.valid_id === valid_id;
        }
        return false;
        
      };

      var i = 0, tex;
      proto.tick = function (timer) {
        if (timer - this.last_gc_time > this.gc_check_time) {
          this.last_gc_time = timer;
          
          for (i = 0; i < this.textures.length; i++) {
            tex = this.textures[i];
            if (tex.valid_id>0) {
              if (timer - tex.last_used_time > this.gc_time) {
                this.free(tex);

              }
            }
          }


        }
      };
      proto.create_texture = function (url) {
        return ge.webgl.texture.from_url(url, true);
      };

      proto.update_texture = function (tex,url) {
        return ge.webgl.texture.update_from_url(tex, url);
      };

      function texture_pooler(def) {
        def = def || {};
        this.last_gc_time = 0;
        this.gc_check_time = def.gc_check_time || 5;
        this.gc_time = def.gc_time || 3;

        var _this = this;
        this.textures = [];
        
        this.pool = new fin.object_pooler(
          function (url) {
            var tex = _this.create_texture(url);           
            tex.valid_id = fin.guidi();
            _this.textures[_this.textures.length] = tex;
            return tex
          },

          function (tex, url) {
            tex.valid_id = fin.guidi();
            return _this.update_texture(tex, url);
          }, def.pool_size);
      }
      return texture_pooler
    });


    return texture;

  });
  ge.webgl.texture.dummy = new ge.webgl.texture();


  ge.webgl.canvas_texture = ge.define(function (proto, _super) {   

    proto.update = function (canvas) {
      this.source =canvas || this.canvas;
      this.needs_update = true;
    };

    //target, format, format_type, source, generate_mipmap, width, height
    return function canvas_texture(width, height, target, format, format_type) {
      _super.apply(this, [target, format, format_type, null, false, width, height]);
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');

      this.parameters[10242] = 33071;
      this.parameters[10243] = 33071;


      this.source = this.canvas;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      this.ctx.transform(1, 0, 0, -1, 0, this.canvas.height);

      this.needs_update = true;
    }


  }, ge.webgl.texture);

  ge.webgl.render_target = ge.define(function (proto) {

    function render_target(renderer, width, height) {
      this.uuid = fin.guidi();
      this.renderer = renderer;
      this.frame_buffer = renderer.gl.createFramebuffer();


      this.vp_left = 0;
      this.vp_top = 0;
      this.width = width;
      this.height = height;
      this.vp_bottom = height;
      this.vp_right = width;
      this.clear_buffer = true;
      this.owned_depth_buffer = false;
      this.set_default_viewport();
      this.ratio = 1;
      return this;
    }

    proto.resize = function (width, height) {

      this.width = width;
      this.height = height;
      if (this.color_texture) {
        this.color_texture.width = width;
        this.color_texture.height = height;
        this.renderer.update_texture(this.color_texture);
      }
      if (this.depth_texture) {
        this.depth_texture.width = width;
        this.depth_texture.height = height;
        this.renderer.update_texture(this.depth_texture);
      }
      if (this.owned_depth_buffer) {
        if (this.depth_buffer) {
          this.renderer.gl.bindRenderbuffer(36161, this.depth_buffer);
          this.renderer.gl.renderbufferStorage(36161, 33189, width, height);

        }
      }
      
      this.vp_bottom = height;
      this.vp_right = width;
    }

    proto.set_viewport_per = function (left, top, right, bottom) {
      this.vp_left = this.width * left;
      this.vp_top = this.height * top;
      this.vp_right = this.width * right;
      this.vp_bottom = this.height * bottom;
      return (this)
    };
    proto.set_viewport = function (left, top, right, bottom) {
      this.vp_left = left;
      this.vp_top = top;
      this.vp_right = right;
      this.vp_bottom = bottom;
    };


    proto.set_default_viewport = function () {
      this.set_viewport_per(0, 0, 1, 1);
      return (this)
    };
    proto.bind = function (force) {

     if (this.renderer.render_target_id === this.uuid && !force) return (false);

      this.renderer.gl.bindFramebuffer(36160, this.frame_buffer);
      this.apply_viewport();
      this.renderer.render_target_id = this.uuid;
      if (this.clear_buffer) this.renderer.gl.clear(16384 | 256);
      return (true)
    };

    proto.apply_viewport = function () {
      this.renderer.gl.viewport(this.vp_left, this.vp_top, this.vp_right - this.vp_left, this.vp_bottom - this.vp_top);
      return (this)
    };
    proto.bind_only = function () {
    
      if (this.renderer.render_target_id === this.uuid) return (this);
      this.renderer.render_target_id = this.uuid;
      this.renderer.gl_bindFramebuffer(36160, this.frame_buffer)
      this.renderer.gl.viewport(this.vp_left, this.vp_top, this.vp_right - this.vp_left, this.vp_bottom - this.vp_top);
      return (this)
    };


    proto.unbind = function () {
      this.renderer.render_target_id = -1;
      this.renderer.gl_bindFramebuffer(36160, null);
    };

    proto.attach_color = function () {
    //target, format, format_type, source, generate_mipmap, width, height
      this.color_texture = new ge.webgl.texture(undefined, undefined, undefined, null, false, this.width, this.height);
      
      this.bind_texture(this.color_texture, 36064);
      this.color_texture.parameters[10242] = 33071;
      this.color_texture.parameters[10243] = 33071;
      this.renderer.update_texture(this.color_texture);
      return (this);

    };

    proto.attach_depth = function () {
      this.depth_texture = this.bind_texture(new ge.webgl.texture(undefined, 6402, 5123, null, false, this.width, this.height), 36096);
      this.depth_texture.parameters[10242] = 33071;
      this.depth_texture.parameters[10243] = 33071;
      return (this)
    };
  
    proto.check_status = function () {

      this.valid = false;
      var status = this.renderer.gl.checkFramebufferStatus(36160);
      switch (status) {
        case 36053:
          this.valid = true;
          break;
        case 36054:
          throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
          break;
        case 36055:
          throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
          break;
        case 36057:
          throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
          break;
        case 36061:
          throw ("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
          break;
        default:
          throw ("Incomplete framebuffer: " + status);
      }

    };
    proto.attach_depth_buffer = function (depth_buffer) {


      if (depth_buffer) {
        this.depth_buffer = depth_buffer;
        this.owned_depth_buffer = false;
      }
      else {
        this.owned_depth_buffer = true;
        this.depth_buffer = this.renderer.gl.createRenderbuffer();
        this.renderer.gl.bindRenderbuffer(36161, this.depth_buffer);
        this.renderer.gl.renderbufferStorage(36161, 33189, this.width, this.height);
      }
      
      this.renderer.gl.bindFramebuffer(36160, this.frame_buffer);
      this.renderer.gl.framebufferRenderbuffer(36160, 36096, 36161, this.depth_buffer);
      this.check_status();

      this.renderer.gl.bindFramebuffer(36160, null);
      this.renderer.gl.bindRenderbuffer(36161, null);
      return (this)
    };

    proto.bind_texture = function (texture, attachment) {

      this.renderer.gl.bindFramebuffer(36160, this.frame_buffer);

      if (texture.gl_texture === null) {       
        this.renderer.update_texture(texture);

      }
      this.renderer.gl.bindTexture(texture.target, texture.gl_texture);

      if (texture.generate_mipmap) {
        this.renderer.gl.generateMipmap(texture.target);
      }

      this.renderer.gl.framebufferTexture2D(36160, attachment, texture.target, texture.gl_texture, 0);


      this.check_status();
      /*
          var status = this.gl.checkFramebufferStatus(36160);
          if (status !== 36053) {
            console.error("frame buffer status:" + status.toString());
          }
          */
      this.renderer.gl.bindTexture(texture.target, null);
      this.renderer.gl.bindFramebuffer(36160, null);

      return (texture);
    };


    return render_target;


  });

  ge.webgl.shader = ge.define(function (proto) {

    function shader(vs, fs) {
      this.vs = vs;
      this.fs = fs;
      this.compiled = false;
      this.uuid = fin.guidi();
      this.params = {};
      this.parent = null;
      this.parts = null;
      return (this);
    }


    proto.collect_parts = function (vertex, fragment) {
      if (this.parent !== null) this.parent.collect_parts(vertex, fragment);
      if (this.parts.vertex) vertex.push(this.parts.vertex);
      if (this.parts.fragment) fragment.push(this.parts.fragment);
    };


    proto.extend = function (source, options) {
      return ge.webgl.shader.parse_shader(source, this, options);
    };

    proto.set_uniform = (function () {      
      return function (id, value) {
        var uni = this.uniforms[id];        
        if (uni) {
          uni.params[uni.params_length] = value;
          uni.func.apply(this.gl, uni.params);
          return true;
        }
        return false;
      }
    })();

    proto.enter = function (renderer) { };
    proto.exit = function (renderer) { };


    fin.macro(function webgl_shader_set_uniform(name$, value$) {
      uni = shader.uniforms[name$];
      if (uni) {
        uni.params[uni.params_length] = value$;
        uni.func.apply(shader.gl, uni.params);
      }
    }, ge);


    fin.macro(function webgl_shader_set_uniform_unsafe(name$, value$) {
      uni = shader.uniforms[name$]; uni.params[uni.params_length] = value$; uni.func.apply(shader.gl, uni.params);

    }, ge);
    

    shader.chunks = {};
    shader.load_chunks = function (text) {
      var chunks = text.split('/*chunk-');
      chunks.forEach(function (chunk) {
        chunk = chunk.trim();
        if (chunk.length > 0) {
          var name = chunk.substr(0, chunk.indexOf('*/') + 2);
          chunk = chunk.replace(name, '');
          name = name.replace('*/', '');
          shader.chunks[name] = chunk;
        }

      });
    };

    shader.create_chunks_lib = function (text) {
      var lib = {}, name;
      text.split('/*chunk-').forEach(function (chunk) {
        chunk = chunk.trim();
        if (chunk.length > 0) {
          name = chunk.substr(0, chunk.indexOf('*/') + 2);
          chunk = chunk.replace(name, '');
          name = name.replace('*/', '');
          if (name.indexOf('global-') === 0) {
            shader.chunks[name] = chunk;
          }
          lib[name] = chunk;
        }
      });
      return lib;
    }
    
    shader.load_chunks(`/*chunk-precision*/ 
#extension GL_OES_standard_derivatives : enable
#if GL_FRAGMENT_PRECISION_HIGH == 1
    precision highp float;
#else
precision mediump float;
#endif

const float DEGTORAD=0.017453292519943295;
const float RADTODEG=57.295779513082323;






/*chunk-shadow-sampling*/

float sample_shadow_map(sampler2D shadowMap, vec2 coords, float compare)
{
	return step(compare, texture2D(shadowMap, coords.xy).r);
}

float sample_shadow_map_linear(sampler2D shadowMap, vec2 coords, float compare, vec2 texelSize)
{
	vec2 pixelPos = coords / texelSize + vec2(0.5);
	vec2 fracPart = fract(pixelPos);
	vec2 startTexel = (pixelPos - fracPart) * texelSize;

	float blTexel = sample_shadow_map(shadowMap, startTexel, compare);
	float brTexel = sample_shadow_map(shadowMap, startTexel + vec2(texelSize.x, 0.0), compare);
	float tlTexel = sample_shadow_map(shadowMap, startTexel + vec2(0.0, texelSize.y), compare);
	float trTexel = sample_shadow_map(shadowMap, startTexel + texelSize, compare);

	float mixA = mix(blTexel, tlTexel, fracPart.y);
	float mixB = mix(brTexel, trTexel, fracPart.y);

	return mix(mixA, mixB, fracPart.x);
}

float sample_shadow_map_pcf(sampler2D shadowMap, vec2 coords, float compare, vec2 texelSize)
{
	const float NUM_SAMPLES = 3.0;
	const float SAMPLES_START = (NUM_SAMPLES - 1.0) / 2.0;
	const float NUM_SAMPLES_SQUARED = NUM_SAMPLES * NUM_SAMPLES;

	float result = 0.0;
	for (float y = -SAMPLES_START; y <= SAMPLES_START; y += 1.0)
	{
		for (float x = -SAMPLES_START; x <= SAMPLES_START; x += 1.0)
		{
			vec2 coordsOffset = vec2(x, y) * texelSize;
			result += sample_shadow_map_linear(shadowMap, coords + coordsOffset, compare, texelSize);
		}
	}
	return result / NUM_SAMPLES_SQUARED;
}


/*chunk-timer*/
uniform float u_timer_rw;


/*chunk-random*/
float random(vec3 seed, int i){
	vec4 seed4 = vec4(seed,i);
	float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}



/*chunk-debug_aabbs*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
attribute vec3 a_box_position_rw;
attribute vec3 a_box_size_rw;
attribute vec3 a_box_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;
varying vec3 v_box_color_rw;
void vertex(){
    vec4 pos;
    pos.xyz=a_position_rw*a_box_size_rw;    
    pos.xyz+=a_box_position_rw;
    pos.w=1.0;    
    v_box_color_rw=a_box_color_rw;
    gl_Position = u_view_projection_rw*u_model_rw*pos;	
    gl_PointSize =5.0;

}
<?=chunk('precision')?>
varying vec3 v_box_color_rw;
void fragment(void) {	
gl_FragColor=vec4(v_box_color_rw,1.0);
}





/*chunk-quat-dquat*/

vec3 quat_transform(vec4 q, vec3 v)
{
   return (v + cross(2.0 * q.xyz, cross(q.xyz, v) + q.w * v));
}

/*chunk-mat3-transpose*/
mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}`);

    shader.context_param;
    shader.$str = function (s, nested_chunks) {
      return ge.str(s, "chunk", "param")(nested_chunks ? ge.webgl.shader.nested_get_chunk : ge.webgl.shader.get_chunk,
        ge.webgl.shader.get_param);
    }
    shader.nested_get_chunk = function (key) {
      return ge.webgl.shader.$str(ge.webgl.shader.chunks[key], true);
    }
    shader.get_chunk = function (key) {
      return ge.webgl.shader.chunks[key];
    }

    shader.get_param = function (p) {
      if (ge.webgl.shader.context_param && ge.webgl.shader.context_param[p] !== undefined) return ge.webgl.shader.context_param[p];
      return "";
    }

    shader.compile = (function () {


      function create_shader(gl, src, type) {
        var shdr = gl.createShader(type);
        gl.shaderSource(shdr, src);
        var source = gl.getShaderSource(shdr);

        gl.compileShader(shdr);
        if (!gl.getShaderParameter(shdr, 35713)) {
          console.log('source', source);
          console.error("Error compiling shader : ", gl.getShaderInfoLog(shdr));
          console.log(src);
          gl.deleteShader(shdr);
          return null;
        }
        return shdr;
      }

      function create_program(gl, vshdr, fshdr, doValidate) {


        var prog = gl.createProgram();
        gl.attachShader(prog, vshdr);
        gl.attachShader(prog, fshdr);

        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, 35714)) {
          console.error("Error creating shader program.", gl.getProgramInfoLog(prog));
          gl.deleteProgram(prog); return null;
        }
        if (doValidate) {
          gl.validateProgram(prog);
          if (!gl.getProgramParameter(prog, 35715)) {
            console.error("Error validating program", gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog); return null;
          }
        }
        gl.detachShader(prog, vshdr);
        gl.detachShader(prog, fshdr);
        gl.deleteShader(fshdr);
        gl.deleteShader(vshdr);

        return prog;
      }


      var collect_uniforms_and_attributes = (function () {

        var uniforms_write_func = {
          5126: ['uniform1f', 2],//'float',
          35664: ['uniform2fv', 2],// 'vec2',                
          35665: ['uniform3fv', 2], //'vec3',
          35666: ['uniform4fv', 2], //'vec4',
          35678: ['uniform1i', 2], //'sampler2D',
          35680: ['uniform1i', 2], //'samplerCube',
          35675: ['uniformMatrix3fv', 3], //'mat3',
          35676: ['uniformMatrix4fv', 3],//'mat4'
          'float': 5126,
          'vec2': 35664,
          'vec3': 35665,
          'vec4': 35666,
        }


        function add_uniform_to_shader(gl, shdr, name, type) {


          var location = gl.getUniformLocation(shdr.program, name);

          var func = uniforms_write_func[type];
          var uni = {};
          if (func[1] === 3)
            uni.params = [location, false, 0];
          else if (func[1] === 2) {
            uni.params = [location, 0];
          }
          uni.func = gl[func[0]];
          uni.params_length = uni.params.length - 1;
          shdr.uniforms[name] = uni;
        }

        return function (gl, shdr) {
          var i = 0, a = 0, info;
          shdr.uniforms = {};
          for (i = 0; i < gl.getProgramParameter(shdr.program, 35718); i++) {
            info = gl.getActiveUniform(shdr.program, i);
            if (info.size > 1) {
              for (a = 0; a < info.size; a++) {
                add_uniform_to_shader(gl, shdr, info.name.replace('[0]', '[' + a + ']'), info.type);
              }
            }
            else if (info.size === 1) {
              add_uniform_to_shader(gl, shdr, info.name, info.type);
            }
          }

          shdr.attributes = {};
          shdr.all_attributes = [];


          for (i = 0; i < gl.getProgramParameter(shdr.program, 35721); i++) {
            info = gl.getActiveAttrib(shdr.program, i);


            shdr.attributes[info.name] = { name: info.name, location: gl.getAttribLocation(shdr.program, info.name) };

            shdr.all_attributes.push(shdr.attributes[info.name]);
          }


        }

      })();

      return function (gl, shdr, _params) {

        if (shdr.compiled) return;
        ge.webgl.shader.context_param = {};
        Object.assign(ge.webgl.shader.context_param, _params);
        Object.assign(ge.webgl.shader.context_param, shdr.params);
        shdr.vs = ge.webgl.shader.$str(shdr.vs, true);
        shdr.fs = ge.webgl.shader.$str(shdr.fs, true);
        shdr.gl = gl;
        var vshdr, fshdr;
        vshdr = create_shader(gl, shdr.vs, 35633);
        if (!vshdr) return false;
        fshdr = create_shader(gl, shdr.fs, 35632);
        if (!fshdr) { gl.deleteShader(vshdr); return false; }
        shdr.program = create_program(gl, vshdr, fshdr, true);

        gl.useProgram(shdr.program);
        collect_uniforms_and_attributes(gl, shdr);

        gl.useProgram(null);
        shdr.compiled = true;
        return (true);

      }
    })();

    shader.parse_flat = function (_source, params) {
      var source = _source.split('/*--fragment--*/');
      var shader = new ge.webgl.shader(source[0].toString().trim(), source[1].toString().trim());
      shader.source = _source;
      shader.params = params || {};
      return shader;
    };


    shader.parse_shader = (function () {
      var functions = ['vertex', 'fragment']
      function parse_shader_source(source) {
        source = source.replace(/\\n/g, '\n');
        var list = [];
        functions.forEach(function (f) {
          list.push({ f: f, i: source.indexOf(f) });
        });
        list.sort(function (a, b) { return a.i - b.i });

        var chars = source.split('');

        function trace_brackets(i) {
          var bc = 1;
          while (bc !== 0 && i < chars.length) {
            if (chars[i] === '{') bc++;
            else if (chars[i] === '}') bc--;
            i++;
          }
          return i;
        }
        function parse_block(m, i1) {
          return source.substr(i1, trace_brackets(source.indexOf(m) + m.length) - i1);
        }

        var i = 0;
        var params = {};
        list.forEach(function (f) {

          var regx = new RegExp('void ' + f.f + '[\\s\\S]*?{', 'ig');

          var m = source.match(regx);
          if (m !== null && m.length > 0) {
            params[f.f] = parse_block(m[0], i);
            i += params[f.f].length;
          }



        });
        return (params);
      }

      function _mm(match, func) {
        if (match !== null) match.forEach(func);
      }

      function get_func(source) {
        var func = {};
        var k = "", dbj = null;
        _mm(source.match(/(\w+ +\w+ *\([^\)]*\) *\{)|(\w+ +\w+ +\w+ *\([^\)]*\) *\{)/g), function (dec) {
          k = dec.replace(/\s+/g, ' ').substr(0, dec.indexOf('(')).trim();
          dbj = { a: k.split(' '), d: dec };
          dbj.f = dbj.a[dbj.a.length - 1];
          func[k] = dbj;
        });
        return func;

      }


      return function (source, parent, options) {
        options = options || {};
        var shader = new ge.webgl.shader(), p = null, part_s = "", part_p = "", rg = null,
          func_s, func_p, f = null, sf = "", sfc = "", dbs, dbp;

        shader.parts = parse_shader_source(source);
        shader.level = 0;
        for (p in shader.parts) {
          shader.parts[p] = shader.parts[p].replace(/\r?\n\s+\{|\r\s+\{/g, '\{').replace(/\s+\(/g, '(');
        }

        if (parent) {
          shader.level = parent.level + 1;
          for (p in shader.parts) {
            if (options[p] === false) {
              continue;
            }
            part_s = shader.parts[p];
            part_p = parent.parts[p];
            if (part_p) {
              func_s = get_func(part_s);
              func_p = get_func(part_p);

              for (f in func_s) {
                if (func_p[f]) {
                  dbs = func_s[f];
                  dbp = func_p[f];
                  sf = 'super_' + dbs.f;
                  if (shader.level > 1) {
                    sfc = f.replace(dbs.f, sf);

                    part_p = part_p.replace(sfc + '(', sfc + shader.level + '(');
                    part_p = part_p.replace(sf + '(', sf + shader.level + '(');

                    sf = dbp.d.replace(dbp.f, 'super_' + dbp.f);
                    part_p = part_p.replace(dbp.d, sf);


                  }
                  else {
                    sf = dbp.d.replace(dbp.f, 'super_' + dbp.f);
                    part_p = part_p.replace(dbp.d, sf);
                  }

                }
              }

              shader.parts[p] = part_p + part_s;



            }
          }

          shader.parts['vertex'] = shader.parts['vertex'] || parent.parts['vertex'];
          shader.parts['fragment'] = shader.parts['fragment'] || parent.parts['fragment'];
        }



        shader.vs = shader.parts['vertex'] + 'void main(){vertex();}';
        shader.fs = shader.parts['fragment'] + 'void main(){fragment();}';

        shader.parent = parent || null;
        return shader;

      }
    })();


    shader.parse = function (source) {
      return this.parse_shader(source, undefined, true, true);
    };


    return shader;

  });
}})()(_FM["fin"],_FM["ge"]);
(function() { return function shading(ge, math) {
  ge.shading = {};

  // Materials
  (function () {

    var glsl = ge.webgl.shader.create_chunks_lib(`/*chunk-flat-material*/

<?=chunk('precision')?>

attribute vec3 a_position_rw;
attribute vec2 a_uv_rw;
attribute vec4 a_color_rw;
uniform mat4 u_view_projection_rw;
uniform mat3 u_texture_matrix_rw;
uniform mat4 u_model_rw;
varying vec2 v_uv_rw;
varying vec4 v_color_rw;
varying vec4 v_position_rw;
vec4 att_position(void);
vec3 att_uv(void);

vec4 att_position(void){
    return vec4(a_position_rw,1.0);
}
vec3 att_uv(void){
    return vec3(a_uv_rw,1.0);
}

void vertex(void){
    v_position_rw=u_model_rw*att_position();
    gl_Position=u_view_projection_rw*v_position_rw;
    v_uv_rw=(u_texture_matrix_rw*att_uv()).xy;
    v_color_rw=a_color_rw;
    gl_PointSize =10.0;
}
<?=chunk('precision')?>

varying vec2 v_uv_rw;
varying vec4 v_position_rw;
varying vec4 v_color_rw;
uniform mat4 u_object_material_rw;
uniform sampler2D u_texture_rw;
void fragment(void) {	

    gl_FragColor = texture2D(u_texture_rw, v_uv_rw)*v_color_rw ;
    gl_FragColor.rgb*=u_object_material_rw[0].rgb;    
	gl_FragColor.w*=u_object_material_rw[0].w;    
	
    

}


/*chunk-shaded-material*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
attribute vec3 a_normal_rw;
attribute vec2 a_uv_rw;
attribute vec4 a_color_rw;
uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;
uniform mat3 u_texture_matrix_rw;

varying vec2 v_uv_rw;
varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec4 v_color_rw;

vec4 att_position(void);
vec4 att_normal(void);
vec3 att_uv(void);

vec4 att_position(void){
    return vec4(a_position_rw,1.0);
}
vec4 att_normal(void){
    return vec4(a_normal_rw,0.0);
}

vec3 att_uv(void){
    return vec3(a_uv_rw,1.0);
}

void vertex(){	
	v_position_rw=u_model_rw*att_position();
    gl_Position=u_view_projection_rw*v_position_rw;
	v_normal_rw=(u_model_rw*att_normal()).xyz;	
	v_uv_rw=(u_texture_matrix_rw*att_uv()).xy;

	v_color_rw=a_color_rw;
		
}

<?=chunk('precision')?>

<?=chunk('global-render-system-lighting')?>

varying vec2 v_uv_rw;
varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec4 v_color_rw;

uniform mat4 u_object_material_rw;
uniform sampler2D u_texture_rw;
uniform vec4 u_eye_position_rw;

void fragment(void) {
	
	vec3 total_light=get_render_system_lighting(
	u_object_material_rw,
	v_position_rw.xyz,
	normalize(v_normal_rw),
	normalize(u_eye_position_rw.xyz - v_position_rw.xyz));
	
	

	gl_FragColor = vec4(total_light, u_object_material_rw[0].w)* 
	texture2D(u_texture_rw, v_uv_rw)*v_color_rw;	
	gl_FragColor.w*=u_object_material_rw[0].w;
	
}

`);

    ge.shading.material = ge.define(function (proto, _super) {
      function ge_material(def) {

        def = def || {};


        _super.apply(this, [def]);


        this.uuid = ge.guidi();

        this.object_material = new Float32Array(16);
        this.ambient = new Float32Array(this.object_material.buffer, 0, 4);
        this.diffuse = new Float32Array(this.object_material.buffer, 4 * 4, 4);
        this.specular = new Float32Array(this.object_material.buffer, 8 * 4, 4);

        this.texture = def.texture || null;

        math.vec3.copy(this.ambient, def.ambient || [0.5, 0.5, 0.5]);
        math.vec3.copy(this.diffuse, def.diffuse || [0.5, 0.5, 0.5]);
        math.vec3.copy(this.specular, def.specular || [0.863, 0.863, 0.863]);

        this.ambient[3] = 1;

        this.texture_matrix = def.texture_matrix || math.mat3();

        if (def.set_texture_matrix) {
          math.mat3.translate_rotate_scale(this.texture_matrix,
            def.set_texture_matrix[0],
            def.set_texture_matrix[1], def.set_texture_matrix[2], def.set_texture_matrix[3], def.set_texture_matrix[4]);
        }

        this.instances_count = -1;
        this.wireframe = def.wireframe || false;
        this.flags = 2;
        if (def.flags !== undefined) this.flags += def.flags;
        this.shader = def.shader || ge.shading.material.shader;
        this.draw_type = 4;
        if (def.draw_type !== undefined) {
          this.draw_type = def.draw_type;
        }

        
        if (def.always_display) {
          this.flags += 2;
        }
       

        this.on_before_render = new ge.event(this);
        this.on_after_render = new ge.event(this);
        this.draw_elements = false;
        this.transparent_layer = def.transparent_layer ||  0;

        if (def.transparent !== undefined) {
          this.set_tansparency(def.transparent);
        }
        this.cull_face = def.cull_face || 1029;

        if (def.both_sides) {
          this.flags += 2048;
        }

        if (def.no_depth_test) {
          this.flags += 1024;
        }
      }

      ge_material.shader = ge.webgl.shader.parse(glsl["flat-material"]);


      proto.set_tansparency = function (v) {
        this.ambient[3] = Math.min(v, 1);
        if (v < 1) this.set_flag(128);
        else this.unset_flag(128);
        return (this);
      };
      proto.set_shinness = function (shin) {
        this.specular[3] = shin;
        return (this);
      };

      proto.set_ambient = function (r, g, b) {
        this.ambient[0] = r;
        this.ambient[1] = g;
        this.ambient[2] = b;
        return (this);
      };


      proto.set_diffuse = function (r, g, b) {
        this.diffuse[0] = r;
        this.diffuse[1] = g;
        this.diffuse[2] = b;
        return (this);
      };

      

      
      proto.render_mesh = (function () {
        var eparams = [null, null, null]

        proto.complete_render_mesh = function (renderer, shader, mesh) {
          if (this.instances_count > -1) {
            if (this.instances_count > 0) {
              if (this.draw_elements) {
                renderer.gl.ANGLE_instanced_arrays.drawElementsInstancedANGLE(this.final_draw_type, this.final_draw_count, 5125, this.final_draw_offset*4, this.instances_count);
              }
              else {
                renderer.gl.ANGLE_instanced_arrays.drawArraysInstancedANGLE(this.final_draw_type, this.final_draw_offset, this.final_draw_count, this.instances_count);
              }
            }
          }
          else {
            if (this.draw_elements) {
              renderer.gl.drawElements(this.final_draw_type, this.final_draw_count, 5125, this.final_draw_offset*4);
            }
            else {

              renderer.gl.drawArrays(this.final_draw_type, this.final_draw_offset, this.final_draw_count);
            }
          }
         // console.log(this.final_draw_type + '/' + this.final_draw_offset + '/' + this.final_draw_count);
        };
        return function (renderer, shader, mesh) {

          eparams[0] = renderer;
          eparams[1] = shader;
          eparams[2] = mesh;

          if (this.flags & 1024) {
          renderer.gl_disable(2929);
        }
        else {
          renderer.gl_enable(2929);
        }
        if ((this.flags & 2048) !== 0) {
          renderer.gl_disable(2884);
        }
        else {
          renderer.gl_enable(2884);
        }

          var uni;

          uni = shader.uniforms["u_object_material_rw"];
      if (uni) {
        uni.params[uni.params_length] = this.object_material;
        uni.func.apply(shader.gl, uni.params);
      }
          uni = shader.uniforms["u_texture_matrix_rw"];
      if (uni) {
        uni.params[uni.params_length] = this.texture_matrix;
        uni.func.apply(shader.gl, uni.params);
      }
          
          renderer.use_texture(this.texture, 0);



          this.final_draw_type = this.wireframe ? 1 : this.draw_type;
          this.final_draw_count = mesh.draw_count || mesh.geometry.num_items;

          this.final_draw_offset = mesh.draw_offset || 0;


          this.draw_elements = renderer.activate_geometry_index_buffer(mesh.geometry, this.wireframe);

          if (this.wireframe) {
            this.final_draw_count *= 2;
            this.final_draw_offset *= 2;

          }


          this.on_before_render.trigger(eparams);

          this.complete_render_mesh(renderer, shader, mesh);

          this.on_after_render.trigger(eparams);




        }
      })();

      return ge_material;
    }, ge.flags_setting);


    ge.shading.shaded_material = ge.define(function (proto, _super) {

      function ge_shaded_material(def) {
        def = def || {};
        _super.apply(this, [def]);
        this.shader = ge.shading.shaded_material.shader;
        this.flags &= ~2;
        this.flags |= 4;
        this.light_pass_limit = 10000;
        this.lights_count = -1;
        this.set_shinness(def.shinness || 100);
        if (def.transparent !== undefined) {
          this.set_tansparency(def.transparent);
        }
        if (def.cast_shadows) {
          this.flags += 16
        };

        if (def.receive_shadows) {
          this.flags += 32
        };
       // if (def.flags !== undefined) this.set_flag(def.flags);
        if (def.both_sides) {
         // this.flags += 2048;
        }
        return (this);

      }

      ge_shaded_material.shader = ge.webgl.shader.parse(glsl["shaded-material"]);


      return ge_shaded_material;
    }, ge.shading.material);




  })();

  // Lights
  (function () {
    ge.shading.light = ge.define(function (proto, _super) {

      proto.update_bounds = function (mat, trans) {
        if (this.light_type > -1) {
          var r = this.range * 0.5;
          var p = this.world_position;


          this.bounds[0] = p[0];
          this.bounds[1] = p[1];
          this.bounds[2] = p[2];
          this.bounds[3] = p[0];
          this.bounds[4] = p[1];
          this.bounds[5] = p[2];

          minx = p[0] - r;
          miny = p[1] - r;
          minz = p[2] - r;

          maxx = p[0] + r;
          maxy = p[1] + r;
          maxz = p[2] + r;


          this.expand_bounds(minx, miny, minz);
          this.expand_bounds(minx, miny, maxz);
          this.expand_bounds(minx, maxy, minz);
          this.expand_bounds(minx, maxy, maxz);

          this.expand_bounds(maxx, miny, minz);
          this.expand_bounds(maxx, miny, maxz);
          this.expand_bounds(maxx, maxy, minz);
          this.expand_bounds(maxx, maxy, maxz);

        }
      };
      proto.set_intensity = function (v) {
        this.ambient[3] = v;
        return (this);
      };
      proto.set_ambient = function (r, g, b) {
        math.vec3.set(this.ambient, r, g, b);
        return (this);
      };

      proto.set_diffuse = function (r, g, b) {
        math.vec3.set(this.diffuse, r, g, b);
        return (this);
      };

      proto.set_specular = function (r, g, b) {
        math.vec3.set(this.specular, r, g, b);
        return (this);
      };

      proto.enable_shadows = function (def) {
        def = def || {};
        this.cast_shadows = true;
        this.shadow_bias = def.shadow_bias || 0.00000001;
        this.shadow_intensity = def.shadow_intensity || this.shadow_intensity;
        this.shadow_map_size = def.shadow_map_size || 1024;
        this.shadow_camera_distance = def.shadow_camera_distance || 30;
        return (this);
      };



      function ge_light(def) {
        def = def || {};
        _super.apply(this, [def]);
        this.light_material = new Float32Array(16);
        this.ambient = new Float32Array(this.light_material.buffer, 0, 4);
        this.diffuse = new Float32Array(this.light_material.buffer, 4 * 4, 4);
        this.specular = new Float32Array(this.light_material.buffer, 8 * 4, 4);
        this.attenuation = new Float32Array(this.light_material.buffer, 12 * 4, 4);

        this.diffuse[3] = -1;
        this.specular[3] = -1;
        this.range = 20000;
        this.light_type = 0;
        this.enabled = true;
        this.item_type = 8;
        this.view_angle = Math.PI;
        this.flags = 2;

        this.version = 0;
        math.vec3.copy(this.ambient, def.ambient || [0.1, 0.1, 0.1]);
        math.vec3.copy(this.diffuse, def.diffuse || [0.87, 0.87, 0.87]);
        math.vec3.copy(this.specular, def.specular || [0.85, 0.85, 0.85]);
        math.vec4.copy(this.attenuation, def.attenuation || [0, 0, 0, 0]);

        this.ambient[3] = def.intensity || 1;
        this.diffuse[3] = -1;
        this.specular[3] = -1;

        this.cast_shadows = def.cast_shadows || false;
        this.shadow_bias = def.shadow_bias || 0.00000001;
        this.shadow_intensity = def.shadow_intensity || 0.25;
        this.shadow_map_size = def.shadow_map_size || 1024;
        this.shadow_camera_distance = def.shadow_camera_distance || 30;


      }

      return ge_light;
    }, ge.renderable);


    ge.shading.point_light = ge.define(function (proto, _super) {


      proto.set_attenuation_by_distance = (function () {
        var values = [[7, 1.0, 0.7, 1.8],
        [13, 1.0, 0.35, 0.44],
        [20, 1.0, 0.22, 0.20],
        [32, 1.0, 0.14, 0.07],
        [50, 1.0, 0.09, 0.032],
        [65, 1.0, 0.07, 0.017],
        [100, 1.0, 0.045, 0.0075],
        [160, 1.0, 0.027, 0.0028],
        [200, 1.0, 0.022, 0.0019],
        [325, 1.0, 0.014, 0.0007],
        [600, 1.0, 0.007, 0.0002],
        [3250, 1.0, 0.0014, 0.000007]];
        var v1, v2, i, f;
        return function (d) {
          for (i = 0; i < values.length; i++) {
            if (d < values[i][0]) {
              v2 = i;
              break;
            }
          }
          if (v2 === 0) {
            return this.set_attenuation.apply(this, values[0]);
          }
          v1 = v2 - 1;
          f = values[v2][0] - values[v1][0];
          f = (d - values[v1][0]) / f;
          this.attenuation[0] = values[v1][1] + (values[v2][1] - values[v1][1]) * f;
          this.attenuation[1] = values[v1][2] + (values[v2][2] - values[v1][2]) * f;
          this.attenuation[2] = values[v1][3] + (values[v2][3] - values[v1][3]) * f;
          return (this);
        }
      })();


      proto.set_attenuation = function (a, b, c) {
        math.vec3.set(this.attenuation, a, b, c);
        return (this);
      };


      function ge_point_light(def) {
        def = def || {};
        _super.apply(this, [def]);
        this.flags = 0;
        this.shadow_intensity = 0.9;
        this.range = def.range || 20;

        if (def.attenuation) {
          this.set_attenuation(this.attenuation[0], this.attenuation[1], this.attenuation[2]);
        }
        else {
          this.set_attenuation_by_distance(this.range * 2);
        }



        this.specular[3] = 0;
        this.diffuse[3] = 0;
        this.light_type = 1;



      }

      return ge_point_light;
    }, ge.shading.light);


    ge.shading.spot_light = ge.define(function (proto, _super) {


      proto.set_outer_angle = function (angle) {
        this.view_angle = angle;
        this.diffuse[3] = Math.cos(angle / 2);
        return (this);
      };

      proto.set_inner_angle = function (angle) {
        this.specular[3] = Math.cos(angle / 2);
        return (this);
      };

      function ge_spot_light(def) {
        def = def || {};
        _super.apply(this, [def]);

        this.range = def.range || 10;
        if (def.attenuation) {
          this.set_attenuation(this.attenuation[0], this.attenuation[1], this.attenuation[2]);
        }
        else {
          this.set_attenuation_by_distance(this.range * 2);
        }
        this.set_outer_angle(def.outer || 0.017453292519943295 * 50).set_inner_angle(def.inner || 0.017453292519943295 * 50);

        this.light_type = 2;




      }

      return ge_spot_light;
    }, ge.shading.point_light);


  })();


}})()(_FM["ge"],_FM["math"]);
(function() { return function index(fin, ge, ecs, math) {

  ecs.register_component('transform', fin.define(function (proto, _super) {
    function transform(def, en, app, comp) {  
      return app.use_system('transform_system').create_transform(def);
    }

    transform.is_functional = true;

    transform.validate = function (comp) {
      comp.app.use_system('transform_system');
    };
    return transform;



  }, ecs.component));


  ecs.register_system('transform_system', fin.define(function (proto, _super) {


    proto.step = function () {

      this.worker.update(this.app.timer);

      this.status_text = this.updated_trans.length + ' trans';

    };

    var i = 0;
    proto.step_end = function () {
      for (i = 0; i < this.updated_trans.length; i++) {
        this.transforms[this.updated_trans.data[i]].updated = false;
      }
      this.updated_trans.clear();
    };



   

    var transform_object = fin.define(function (proto) {


      proto.set_parent = function (par) {
        this.sys.set_parent(this, par);
        return this;
      };


      proto.add_pos = function (x, y, z) {
        this.sys.add_pos(this, x, y, z);
        return this;
      };

      proto.set_pos = function (x, y, z) {
        this.sys.set_pos(this,x, y, z);
        return this;
      };


      proto.set_rot = function (x, y, z, w) {
        this.sys.set_rot(this,x, y, z,w);
        return this;
      };


      proto.set_scale = function (x, y, z) {
        this.sys.set_scale(this,x, y, z);
        return this;
      };

      proto.set_eular = function (x, y, z) {
        this.sys.set_eular(this,x, y, z);
        return this;
      };

      var tid = 1;

      return function transform_object(sys) {
        this.id = tid++;
        this.data = new Float32Array(10);

        this.pos = new Float32Array(this.data.buffer, 0, 3);
        this.rot = new Float32Array(this.data.buffer, 12, 4);
        this.scale = new Float32Array(this.data.buffer, 28, 3);
        this.updated = false
        this.p = 0;
        this.sys = sys;


      }


    });


    function setup_commands(self, cmd, worker) {

      var ci=0;
      self.create_transform = function (def) {


        var trans = this.transforms.pool.get();
        ci = worker.begin_command(500, 12)


        if (def.parent) {
          trans.p = def.parent.id;
        }

        def.pos = def.pos || [0, 0, 0];
        def.rot = def.rot || [0, 0, 0, 1];
        def.scale = def.scale || [1, 1, 1];

        if (def.eular) {
          math.quat.rotate_eular(def.rot, def.eular[0], def.eular[1], def.eular[2]);
        }

        cmd[ci++] = trans.id;
        cmd[ci++] = trans.p;
        cmd[ci++] = def.pos[0];
        cmd[ci++] = def.pos[1];
        cmd[ci++] = def.pos[2];

        cmd[ci++] = def.rot[0];
        cmd[ci++] = def.rot[1];
        cmd[ci++] = def.rot[2];
        cmd[ci++] = def.rot[3];

        cmd[ci++] = def.scale[0];
        cmd[ci++] = def.scale[1];
        cmd[ci++] = def.scale[2];



        return trans;
        ;
      }


      self.set_parent = function (trans, ptrans) {
        if (trans == undefined || ptrans == undefined) return;
        ci = worker.begin_command(1000, 2);
        cmd[ci++] = trans.id;
        cmd[ci++] = ptrans.id;
      };

      self.set_pos = function (trans, x, y, z) {
        ci = worker.begin_command(1100, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };

      self.add_pos = function (trans, x, y, z) {
        ci = worker.begin_command(1110, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };


     

      self.drage_to_direction = (function () {
        var pos = math.vec3(), inv_rot = math.quat();
        return function (trans, drag_dir, drag_mag) {
          math.vec3.scale(pos, drag_dir, drag_mag);
          math.quat.invert(inv_rot, trans.rot);
          math.vec3.transform_quat(pos, pos, inv_rot);
          this.add_pos(trans, pos[0], pos[1], 0)
          return this;
        }

      })();


      self.set_scale = function (trans, x, y, z) {
        ci = worker.begin_command(1200, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };


      self.set_rot = function (trans, x, y, z, w) {
        ci=worker.set_command(1300, 5)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
        cmd[ci++] = w;
      };


      self.set_eular = function (trans, x, y, z) {
        ci = worker.begin_command(1400, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };


      self.set_eular_anim = function (trans, x, y, z) {
        ci = worker.begin_command(2000, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };

      self.set_rot_anim = function (trans, x, y, z, w) {
        ci = worker.begin_command(2100, 5)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
        cmd[ci++] = w;
      };


      self.set_pos_anim = function (trans, x, y, z) {
        ci = worker.begin_command(2200, 4)
        cmd[ci++] = trans.id;
        cmd[ci++] = x;
        cmd[ci++] = y;
        cmd[ci++] = z;
      };


      var tdata, trans, tid;


      worker.add_output(989898, function (dt, oi, count) {
        while (oi < count) {
          tid = dt[oi++];
          trans = self.transforms[tid];

          if (trans) {

            tdata = trans.data;
            trans.p = dt[oi++];
            tdata[0] = dt[oi++];
            tdata[1] = dt[oi++];
            tdata[2] = dt[oi++];
            tdata[3] = dt[oi++];
            tdata[4] = dt[oi++];
            tdata[5] = dt[oi++];
            tdata[6] = dt[oi++];
            tdata[7] = dt[oi++];
            tdata[8] = dt[oi++];
            tdata[9] = dt[oi++];

            trans.updated = true;
            self.updated_trans.push(trans.id);

          }

        }
      });
    }



    function create_system(sys) {

      

      sys.transforms = {list:[]};

      var S5$qX,S5$qY,S5$qZ,S5$qW,S5$dqX,S5$dqY,S5$dqZ,S5$qLen,S5$quat1,S5$dqW,S5$quat2,S5$quat3;
      var S0$x,S0$y,S0$z,S0$qx,S0$qy,S0$qz,S0$qw,S0$A,S0$uvx,S0$uvy,S0$uvz,S0$uuvx,S0$uuvy,S0$uuvz;



     
      sys.anims_pool = new fin.object_pooler(function () {
        return [];
      });



      //create transform

      sys.commands[500] = function (dt, ci) {
       
        tid = dt[ci++];
        trans = sys.transforms[tid]

        if (trans === undefined) {
          trans = {
            p: 0, update: false,
            pos: new Float32Array(3),
            rot: new Float32Array(4),
            scale: new Float32Array(3),
            world_pos: new Float32Array(3),
            world_rot: new Float32Array(4),
            world_scale: new Float32Array(3)
          };
          sys.transforms.list.push(trans);
        }


        trans.id = tid;

        sys.transforms[tid] = trans;
       


        trans.p = dt[ci++];
        trans.pos[0] = dt[ci++];
        trans.pos[1] = dt[ci++];
        trans.pos[2] = dt[ci++];

        trans.rot[0] = dt[ci++];
        trans.rot[1] = dt[ci++];
        trans.rot[2] = dt[ci++];
        trans.rot[3] = dt[ci++];

        trans.scale[0] = dt[ci++];
        trans.scale[1] = dt[ci++];
        trans.scale[2] = dt[ci++];

        trans.update = true;
      }

      //set parent
      sys.commands[1000] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        ptrans = sys.transforms[dt[ci++]];

        if (trans && ptrans) {
          trans.p = ptrans.id;
          trans.update = true;
        }
      };

      // //set pos
      sys.commands[1100] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          trans.pos[0] = dt[ci++];
          trans.pos[1] = dt[ci++];
          trans.pos[2] = dt[ci++];
          trans.update = true;
        }
      };

      // //add pos
      sys.commands[1110] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          trans.pos[0] += dt[ci++];
          trans.pos[1] += dt[ci++];
          trans.pos[2] += dt[ci++];
          trans.update = true;
        }
      };

      // //set scale
      sys.commands[1200] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          trans.scale[0] = dt[ci++];
          trans.scale[1] = dt[ci++];
          trans.scale[2] = dt[ci++];
          trans.update = true;
        }
      };

      //set rot
      sys.commands[1300] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          trans.rot[0] = dt[ci++];
          trans.rot[1] = dt[ci++];
          trans.rot[2] = dt[ci++];
          trans.rot[3] = dt[ci++];
          trans.update = true;
        }
      };

      //set eular
      sys.commands[1400] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          _x = dt[ci++]; _y = dt[ci++]; _z = dt[ci++];
          S5$quat1 = trans.rot;

      
      S5$qX = Math.sin(_x * 0.5); S5$qY = Math.sin(_y * 0.5); S5$qZ = Math.sin(_z * 0.5);
      S5$dqX = Math.cos(_x * 0.5); S5$dqY = Math.cos(_y * 0.5); S5$dqZ = Math.cos(_z * 0.5);



      S5$quat1[0] = S5$qX * S5$dqY * S5$dqZ - S5$dqX * S5$qY * S5$qZ;
      S5$quat1[1] = S5$dqX * S5$qY * S5$dqZ + S5$qX * S5$dqY * S5$qZ;
      S5$quat1[2] = S5$dqX * S5$dqY * S5$qZ - S5$qX * S5$qY * S5$dqZ;
      S5$quat1[3] = S5$dqX * S5$dqY * S5$dqZ + S5$qX * S5$qY * S5$qZ;


      S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
      S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;

      if (S5$qLen > 0) {
        S5$qLen = 1 / Math.sqrt(S5$qLen);
      }

      S5$quat1[0] = S5$qX * S5$qLen;
      S5$quat1[1] = S5$qY * S5$qLen;
      S5$quat1[2] = S5$qZ * S5$qLen;
      S5$quat1[3] = S5$qW * S5$qLen;
          trans.update = true;
        }
      };


      

      //set eular anim
      sys.commands[2000] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          _x = dt[ci++]; _y = dt[ci++]; _z = dt[ci++];
          trans.rot_anim = sys.anims_pool.get();
          S5$quat1 = trans.rot_anim;

      
      S5$qX = Math.sin(_x * 0.5); S5$qY = Math.sin(_y * 0.5); S5$qZ = Math.sin(_z * 0.5);
      S5$dqX = Math.cos(_x * 0.5); S5$dqY = Math.cos(_y * 0.5); S5$dqZ = Math.cos(_z * 0.5);



      S5$quat1[0] = S5$qX * S5$dqY * S5$dqZ - S5$dqX * S5$qY * S5$qZ;
      S5$quat1[1] = S5$dqX * S5$qY * S5$dqZ + S5$qX * S5$dqY * S5$qZ;
      S5$quat1[2] = S5$dqX * S5$dqY * S5$qZ - S5$qX * S5$qY * S5$dqZ;
      S5$quat1[3] = S5$dqX * S5$dqY * S5$dqZ + S5$qX * S5$qY * S5$qZ;


      S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
      S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;

      if (S5$qLen > 0) {
        S5$qLen = 1 / Math.sqrt(S5$qLen);
      }

      S5$quat1[0] = S5$qX * S5$qLen;
      S5$quat1[1] = S5$qY * S5$qLen;
      S5$quat1[2] = S5$qZ * S5$qLen;
      S5$quat1[3] = S5$qW * S5$qLen;
          trans.update = true;
        }
      };

      //set rot anim
      sys.commands[2100] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          trans.rot_anim = sys.anims_pool.get();
          trans.rot_anim[0] = dt[ci++];
          trans.rot_anim[1] = dt[ci++];
          trans.rot_anim[2] = dt[ci++];
          trans.rot_anim[3] = dt[ci++];
          trans.update = true;
        }
      };

      //set pos anim
      sys.commands[2200] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {

          trans.pos_anim = sys.anims_pool.get();
          trans.pos_anim[0] = dt[ci++];
          trans.pos_anim[1] = dt[ci++];
          trans.pos_anim[2] = dt[ci++];

          trans.update = true;
        }
      };


      sys.signals[32] = function (dt, ci, count) {


      };

      //anim values

      var avalues = new Float32Array(10);
      sys.commands[300] = function (dt, ci) {
        trans = sys.transforms[dt[ci++]];
        if (trans) {
          _x = dt[ci++]; _y = dt[ci++]; _z = dt[ci++];
          S5$quat1 = trans.rot;

      
      S5$qX = Math.sin(_x * 0.5); S5$qY = Math.sin(_y * 0.5); S5$qZ = Math.sin(_z * 0.5);
      S5$dqX = Math.cos(_x * 0.5); S5$dqY = Math.cos(_y * 0.5); S5$dqZ = Math.cos(_z * 0.5);



      S5$quat1[0] = S5$qX * S5$dqY * S5$dqZ - S5$dqX * S5$qY * S5$qZ;
      S5$quat1[1] = S5$dqX * S5$qY * S5$dqZ + S5$qX * S5$dqY * S5$qZ;
      S5$quat1[2] = S5$dqX * S5$dqY * S5$qZ - S5$qX * S5$qY * S5$dqZ;
      S5$quat1[3] = S5$dqX * S5$dqY * S5$dqZ + S5$qX * S5$qY * S5$qZ;


      S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
      S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;

      if (S5$qLen > 0) {
        S5$qLen = 1 / Math.sqrt(S5$qLen);
      }

      S5$quat1[0] = S5$qX * S5$qLen;
      S5$quat1[1] = S5$qY * S5$qLen;
      S5$quat1[2] = S5$qZ * S5$qLen;
      S5$quat1[3] = S5$qW * S5$qLen;
          trans.update = true;
        }
      };

      

      var rot_anim = [], pos_anim = [], scale_anim = [], use_rot, use_pos, use_scale;

      var temp_pos = [0, 0, 0], ti = 0, list_count,list;
      var trans, ptrans, tid, _x, _y, _z, _w;
  
      sys.process_list = function (list, list_count) {
        for (ti = 0; ti < list_count; ti++) {
          trans = list[ti];

          use_rot = trans.rot;
          use_pos = trans.pos;
          use_scale = trans.scale;


          if (trans.pos_anim) {

            pos_anim[0] = use_pos[0] + trans.pos_anim[0]; pos_anim[1] = use_pos[1] + trans.pos_anim[1]; pos_anim[2] = use_pos[2] + trans.pos_anim[2];
            use_pos = pos_anim;
            sys.anims_pool.free(trans.pos_anim);
            trans.pos_anim = undefined;
          }

          if (trans.scale_anim) {

            scale_anim[0] = use_scale[0] * trans.scale_anim[0]; scale_anim[1] = use_scale[1] * trans.scale_anim[1]; scale_anim[2] = use_scale[2] * trans.scale_anim[2];
            use_scale = scale_anim;
            sys.anims_pool.free(trans.scale_anim);
            trans.scale_anim = undefined;
          }

          if (trans.rot_anim) {
            S5$quat1 = rot_anim;
      S5$quat2 = use_rot;
      S5$quat3 = trans.rot_anim;


      S5$qX = S5$quat2[0]; S5$qY = S5$quat2[1]; S5$qZ = S5$quat2[2]; S5$qW = S5$quat2[3];

      S5$dqX = S5$quat3[0]; S5$dqY = S5$quat3[1]; S5$dqZ = S5$quat3[2]; S5$dqW = S5$quat3[3];

      S5$quat1[0] = S5$qX * S5$dqW + S5$qW * S5$dqX + S5$qY * S5$dqZ - S5$qZ * S5$dqY;
      S5$quat1[1] = S5$qY * S5$dqW + S5$qW * S5$dqY + S5$qZ * S5$dqX - S5$qX * S5$dqZ;
      S5$quat1[2] = S5$qZ * S5$dqW + S5$qW * S5$dqZ + S5$qX * S5$dqY - S5$qY * S5$dqX;
      S5$quat1[3] = S5$qW * S5$dqW - S5$qX * S5$dqX - S5$qY * S5$dqY - S5$qZ * S5$dqZ;
            use_rot = rot_anim;
            sys.anims_pool.free(trans.rot_anim);
            trans.rot_anim = undefined;
          }


          if (trans.p > 0) {
            ptrans = sys.transforms[trans.p];

            S5$quat1 = trans.world_rot;
      S5$quat2 = ptrans.world_rot;
      S5$quat3 = use_rot;


      S5$qX = S5$quat2[0]; S5$qY = S5$quat2[1]; S5$qZ = S5$quat2[2]; S5$qW = S5$quat2[3];

      S5$dqX = S5$quat3[0]; S5$dqY = S5$quat3[1]; S5$dqZ = S5$quat3[2]; S5$dqW = S5$quat3[3];

      S5$quat1[0] = S5$qX * S5$dqW + S5$qW * S5$dqX + S5$qY * S5$dqZ - S5$qZ * S5$dqY;
      S5$quat1[1] = S5$qY * S5$dqW + S5$qW * S5$dqY + S5$qZ * S5$dqX - S5$qX * S5$dqZ;
      S5$quat1[2] = S5$qZ * S5$dqW + S5$qW * S5$dqZ + S5$qX * S5$dqY - S5$qY * S5$dqX;
      S5$quat1[3] = S5$qW * S5$dqW - S5$qX * S5$dqX - S5$qY * S5$dqY - S5$qZ * S5$dqZ;

            trans.world_scale[0] = ptrans.world_scale[0] * use_scale[0]; trans.world_scale[1] = ptrans.world_scale[1] * use_scale[1]; trans.world_scale[2] = ptrans.world_scale[2] * use_scale[2];

            temp_pos[0] = use_pos[0] * ptrans.world_scale[0]; temp_pos[1] = use_pos[1] * ptrans.world_scale[1]; temp_pos[2] = use_pos[2] * ptrans.world_scale[2];

            S0$x = temp_pos[0]; S0$y = temp_pos[1]; S0$z = temp_pos[2];
      S0$qx = ptrans.world_rot[0]; S0$qy = ptrans.world_rot[1]; S0$qz = ptrans.world_rot[2]; S0$qw = ptrans.world_rot[3];


      S0$uvx = S0$qy * S0$z - S0$qz * S0$y;
      S0$uvy = S0$qz * S0$x - S0$qx * S0$z;
      S0$uvz = S0$qx * S0$y - S0$qy * S0$x;


      S0$uuvx = S0$qy * S0$uvz - S0$qz * S0$uvy;
      S0$uuvy = S0$qz * S0$uvx - S0$qx * S0$uvz;
      S0$uuvz = S0$qx * S0$uvy - S0$qy * S0$uvx;

      
      S0$A = S0$qw * 2;
      S0$uvx *= S0$A;
      S0$uvy *= S0$A;
      S0$uvz *= S0$A;

      S0$uuvx *= 2;
      S0$uuvy *= 2;
      S0$uuvz *= 2;

      temp_pos[0] = S0$x + S0$uvx + S0$uuvx;
      temp_pos[1] = S0$y + S0$uvy + S0$uuvy;
      temp_pos[2] = S0$z + S0$uvz + S0$uuvz;

            trans.world_pos[0] = temp_pos[0] + ptrans.world_pos[0]; trans.world_pos[1] = temp_pos[1] + ptrans.world_pos[1]; trans.world_pos[2] = temp_pos[2] + ptrans.world_pos[2];
          }
          else {

            trans.world_scale[0] = use_scale[0]; trans.world_scale[1] = use_scale[1]; trans.world_scale[2] = use_scale[2];
            trans.world_pos[0] = use_pos[0]; trans.world_pos[1] = use_pos[1]; trans.world_pos[2] = use_pos[2];
            trans.world_rot[0] = use_rot[0];trans.world_rot[1] = use_rot[1];trans.world_rot[2] = use_rot[2];trans.world_rot[3] = use_rot[3];

          }

        }
      }



      sys.updated_list = new fin.array();

      sys.add_output(989898, function (dt, oi) {


        list = sys.transforms.list;
        list_count = list.length;

        sys.updated_list.clear();
        for (ti = 0; ti < list_count; ti++) {
          trans = list[ti];
          if (trans.p > 0) {
            ptrans = sys.transforms[trans.p];
            trans.update = ptrans.update || trans.update;
          }

          if (trans.update) sys.updated_list.push(trans);
        }



        sys.process_list(sys.updated_list.data, sys.updated_list.length);

       


        for (ti = 0; ti < sys.updated_list.length; ti++) {
          trans = sys.updated_list.data[ti];
          dt[oi++] = trans.id;
          dt[oi++] = trans.p;
          dt[oi++] = trans.world_pos[0];
          dt[oi++] = trans.world_pos[1];
          dt[oi++] = trans.world_pos[2];

          dt[oi++] = trans.world_rot[0];
          dt[oi++] = trans.world_rot[1];
          dt[oi++] = trans.world_rot[2];
          dt[oi++] = trans.world_rot[3];

          dt[oi++] = trans.world_scale[0];
          dt[oi++] = trans.world_scale[1];
          dt[oi++] = trans.world_scale[2];         
        }

        return oi;

      });
     

      sys.windup.push(function (dt,oi) {
        for (ti = 0; ti < sys.updated_list.length; ti++) {
          sys.updated_list.data[ti].update = false;
        }
      });
     
    }

    proto.validate = function (app) {
      this.priority = 1;     
    };
    function transform_system(def) {
      def = def || {};
      _super.apply(this, arguments);
      var self = this;




      var mods = [create_system];

     

      if (def.extend) {
        mods.push(def.extend);
      }
      def.mods = mods;
      def.name = "transform_system";
      this.worker = fin.worker.data_command_worker(def);

      this.worker.commands_group(setup_commands, this);
          

      this.transforms = {
        pool: new fin.object_pooler(function () {
          var trans = new transform_object(self);
          self.transforms[trans.id] = trans;
          return trans;
        })
      };

      this.updated_trans = new ge.array();

      console.log(this);
      
    }


    transform_system.extensions = [];



    return transform_system;



  }, ecs.system));


}})()(_FM["fin"],_FM["ge"],_FM["ecs"],_FM["math"]);
(function() { return function animation_system(fin, ge, ecs, math) {

  ecs.register_component('animations_player', fin.define(function (proto, _super) {


    function animations_player(def, en, app, comp) {
      this.entity = en;
      this.clock = 0;
      this.animations = def.animations || [];
      this.anim_data = new Float32Array(512);
    }

    animations_player.validate = function (comp) {
      comp.app.use_system('animation_system');
    };
    return animations_player;



  }, ecs.component));



  ecs.register_component('animations_mixer', fin.define(function (proto, _super) {


    function animations_mixer(def, en, app, comp) {
       return app.use_system("animation_system").create_mixer(def);
    }

    animations_mixer.is_functional = true;

    animations_mixer.validate = function (comp) {
      comp.app.use_system('animation_system');
    };
    return animations_mixer;



  }, ecs.component));



  ecs.register_system('animation_system', fin.define(function (proto, _super) {

   
    proto.step = function () {
      this.worker.update(this.app.timer);

    }

    var oid, output_channel;
    proto.step_end = function () {
      for (oid = 0; oid < this.output_channels.length; oid++) {
        output_channel = this.output_channels[oid];
        if (output_channel) {
          output_channel.di = 0;
        }
      }

    }
    proto.create_mixer = function (def) {
      return {

      }
    }

    proto.validate = function (app) {
      this.priority = app.use_system('transform_system').priority - 50;
    };

    function animation_system(def) {
      _super.apply(this, arguments);



      this.worker = fin.worker.data_command_worker({
        name: "animation_system",
        transform_system_wid: fin.worker.workers['transform_system'].wid,
        mods: [
          function (anim_sys) {
            var S5$cosom,S5$omega,S5$sinom,S5$scale0,S5$scale1;

            anim_sys.play_animation = (function () {


              var bi, block, fr_size, btime, fi, j, pi, f1, f2, frames, fvalues = new Float32Array(4);
              var total_frames, time_per_frame, time1, output_channel;
              return function (anim, clock, oid, weight) {


                output_channel = this.output_channels[oid];
                for (bi = 0; bi < anim.blocks.length; bi++) {
                  block = anim.blocks[bi];
                  btime = clock - block.time;

                  if (btime > 0 && btime < (block.length * (block.repeat || 1))) {

                    btime = (btime % block.length) / block.length;
                    frames = block.frames;


                    fr_size = block.fr_size || 1;


                    if (block.flat) {
                      total_frames = Math.floor(frames.length / fr_size) - 1;
                      time_per_frame = 1 / (total_frames);

                      f1 = (Math.floor(total_frames * btime));
                      f2 = ((f1 + 1) * fr_size);
                      time1 = time_per_frame * f1;
                      f1 *= fr_size;
                      j = (btime - time1) / ((time1 + time_per_frame) - time1);
                      fr_size++;

                      f1 -= 1;
                      f2 -= 1;


                    }
                    else {
                      fr_size++;
                      for (fi = 0; fi <= frames.length; fi += fr_size) {
                        if (fi > 0) {
                          if (btime >= j && btime <= frames[fi] + 0.000001) {
                            pi = fi;
                            break;
                          }
                        }
                        j = frames[fi];
                      }
                      f1 = pi - fr_size;
                      f2 = pi;
                      j = (btime - frames[f1]) / (frames[f2] - frames[f1]);

                    }



                    if (fr_size === 2) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                    }
                    else if (fr_size === 3) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                      fvalues[1] = frames[f1 + 2] + (frames[f2 + 2] - frames[f1 + 2]) * j;
                    }
                    else if (fr_size === 4) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                      fvalues[1] = frames[f1 + 2] + (frames[f2 + 2] - frames[f1 + 2]) * j;
                      fvalues[2] = frames[f1 + 3] + (frames[f2 + 3] - frames[f1 + 3]) * j;
                    }
                    else if (fr_size === 5) {
                      S5$cosom = frames[f1 + 1] * frames[f2 + 1] + frames[f1 + 2] * frames[f2 + 2] + frames[f1 + 3] * frames[f2 + 3] + frames[f1 + 4] * frames[f2 + 4];

      if (S5$cosom < 0.0) {
        S5$cosom = -S5$cosom;
        frames[f2 + 1] = -frames[f2 + 1];
        frames[f2 + 2] = -frames[f2 + 2];
        frames[f2 + 3] = -frames[f2 + 3];
        frames[f2 + 4] = -frames[f2 + 4];
      }

      
      if (1.0 - S5$cosom > 0.000001) {

        S5$omega = Math.acos(S5$cosom);
        S5$sinom = Math.sin(S5$omega);
        S5$scale0 = Math.sin((1.0 - j) * S5$omega) / S5$sinom;
        S5$scale1 = Math.sin(j * S5$omega) / S5$sinom;

      } else {       
        S5$scale0 = 1.0 - j;
        S5$scale1 = j;
      }


      fvalues[0] = S5$scale0 * frames[f1 + 1] + S5$scale1 * frames[f2 + 1];
      fvalues[1] = S5$scale0 * frames[f1 + 2] + S5$scale1 * frames[f2 + 2];
      fvalues[2] = S5$scale0 * frames[f1 + 3] + S5$scale1 * frames[f2 + 3];
      fvalues[3] = S5$scale0 * frames[f1 + 4] + S5$scale1 * frames[f2 + 4];;
                    }

                    for (fi = 0; fi < fr_size - 1; fi++) {

                      output_channel.data[block.oi + fi] += (fvalues[fi] * weight);
                    }
                    output_channel.di = Math.max(output_channel.di, block.oi + fr_size);
                  }



                }
              }


            })();


            anim_sys.animations = {};

            anim_sys.ai = 0;

            anim_sys.animation_sessions = {
              pool: new fin.object_pooler(function () {
                var asess = {
                  anim: null,
                };

                return asess;
              }),
              active: new fin.ping_pong_array("queue", "updates")
            };

            anim_sys.output_channels = [];

            anim_sys.begin_step = function (m) {

              if (m.data.length === undefined) {
                if (m.data.op === "create_animation") {
                  sys.animations[m.data.id] = m.data;
                }
                return false;
              }

            }

            var anim, asess, aid;

            anim_sys.commands[2000] = function (dt, ci) {
              aid = dt[ci++];
              anim = anim_sys.animations[aid];
              if (anim) {
                asess = anim_sys.animation_sessions.pool.get();
                asess.anim = anim;
                asess.life_start = anim_sys.time;
                asess.duration = dt[ci++];
                asess.repeat = dt[ci++];
                asess.oid = dt[ci++];
                asess.weight = dt[ci++];
                if (!anim_sys.output_channels[asess.oid]) {
                  anim_sys.output_channels[asess.oid] = { data: new Float32Array(64), di: 0 };
                }
                asess.life = asess.duration * asess.repeat;
                anim_sys.animation_sessions.active.queue[anim_sys.ai++] = asess;

              }
            };

            anim_sys.commands[1000] = function (dt, ci) {
              anim = JSON.parse(anim_sys.unpack_string_command(dt, ci));
              anim_sys.animations[anim.id] = anim;
            };






            var  clock, output_channel, ii = 0;


            anim_sys.add_output(1024, function (dt, oi) {
              var sys = anim_sys, ai = 0;
              var aqueue = sys.animation_sessions.active.queue;
              var aupdate = sys.animation_sessions.active.updates;
              var time = sys.time;
              ai = 0;

              for (ai = 0; ai < sys.output_channels.length; ai++) {
                output_channel = sys.output_channels[ai];
                if (output_channel) {
                  output_channel.data.fill(0);
                  output_channel.di = 0;
                }
              }
              ai = 0;
              while (sys.ai > 0) {
                asess = aqueue[--sys.ai];
                aqueue[sys.ai] = undefined;
                clock = time - asess.life_start
                if (asess.life < 0 || clock < asess.life) {
                  sys.play_animation(asess.anim, clock % asess.duration / asess.duration, asess.oid, asess.weight);

                  aupdate[ai++] = asess;
                }
                else {
                  asess.anim = undefined;
                  sys.animation_sessions.pool.free(asess);
                  console.log(asess);
                }
              }

              sys.ai = ai;
              sys.animation_sessions.active.swap();

              for (ai = 0; ai < sys.output_channels.length; ai++) {
                output_channel = sys.output_channels[ai];
                if (output_channel && output_channel.di > 0) {

                  dt[oi++] = ai;
                  dt[oi++] = output_channel.di;
                  for (ii = 0; ii < output_channel.di; ii++) {
                    dt[oi++] = output_channel.data[ii];
                  }
                }


              }

              return oi;


            });


            console.log(anim_sys);


          }
        ]
      });


      this.worker.commands_group(function (self, cmd, worker) {


        var aid = 1, ci = 0;
        console.log(self);

        self.create_animation = function (anim) {
          anim.id = aid++;
          worker.pack_string_command(1000, JSON.stringify(anim));
          return anim;
        };

        self.trigger_animation = function (aid, duration, repeat, oid, weight) {
          ci = worker.begin_command(2000, 5);
          cmd[ci++] = aid;
          oid = oid || 0;
          cmd[ci++] = duration || 1;
          cmd[ci++] = repeat || 1111111;
          cmd[ci++] = oid;
          cmd[ci++] = weight || 1;

          output_channel = self.output_channels[oid];
          if (!output_channel) {
            output_channel = { di: 0, data: new Float32Array(64) };
            self.output_channels[oid] = output_channel;
          }

          return output_channel;
        };


      
        self.output_channels = [];

        var output_channel, oid = 0, ii = 0;
        worker.add_output(1024, function (dt, oi, count) {
          while (oi < count) {

            oid = dt[oi++];
            output_channel = self.output_channels[oid];
            output_channel.di = dt[oi++]
            for (ii = 0; ii < output_channel.di; ii++) {
              output_channel.data[ii] = dt[oi++];

            }

          }
        });


      }, this);

    }




    return animation_system;



  }, ecs.system));





  ecs.register_component('worker_animation_player', fin.define(function (proto, _super) {
    function worker_animation_player(def, en, app, comp) {
      return app.use_system('worker_animation_system').create_player(def);
    }

    worker_animation_player.is_functional = true;

    worker_animation_player.validate = function (comp) {
      comp.app.use_system('worker_animation_system');
    };
    return worker_animation_player;



  }, ecs.component));
  ecs.register_system('worker_animation_system', fin.define(function (proto, _super) {



    proto.step = function () {
      this.worker.update(this.app.timer, this.app.current_time_delta);
    }


    var oid, output_channel;
    proto.step_end = function () {
      for (oid = 0; oid < this.output_channels.length; oid++) {
        output_channel = this.output_channels[oid];
        if (output_channel) {
          output_channel.di = 0;
        }
      }

    }

    proto.create_player = function (def) {

    }


    var _anm = new ge.array(),anim_id=1;
    proto.create_animation = function (anim) {
      /*
      _anm.clear();
      _anm.push(anim.duration).push(anim.blocks.length);

      var fr_size,fi=0;
      anim.blocks.forEach(function (block) {
        fr_size = block.fr_size || 1;
        if (block.flat) fr_size = -fr_size;
        _anm.push(block.time).push(block.length).push(block.oi).push(fr_size);
        for (fi = 0; fi < block.frames.length; fi++)
          _anm.push(block.frames[fi]);

      });
      */
      anim.id = anim_id++;
      anim.op="create_animation"
      this.worker.postMessage(anim);
      return anim;


    }

    proto.validate = function (app) {
      this.priority = app.use_system('worker_transform_system').priority + 200;

    };


    function worker_animation_system(def) {
      _super.apply(this, arguments);
      var self = this;
     

      this.worker = fin.worker.data_command_worker({
        mods: [
          function (sys) {
            var S5$cosom,S5$omega,S5$sinom,S5$scale0,S5$scale1;

            sys.play_animation = (function () {


              var bi, block, fr_size, btime, fi, j, pi, f1, f2, frames, fvalues = new Float32Array(4);
              var total_frames, time_per_frame, time1, output_channel;
              return function (anim, clock, oid,weight) {


                output_channel = this.output_channels[oid];
                for (bi = 0; bi < anim.blocks.length; bi++) {
                  block = anim.blocks[bi];
                  btime = clock - block.time;

                  if (btime > 0 && btime < (block.length * (block.repeat || 1))) {

                    btime = (btime % block.length) / block.length;
                    frames = block.frames;


                    fr_size = block.fr_size || 1;


                    if (block.flat) {
                      total_frames = Math.floor(frames.length / fr_size) - 1;
                      time_per_frame = 1 / (total_frames);

                      f1 = (Math.floor(total_frames * btime));
                      f2 = ((f1 + 1) * fr_size);
                      time1 = time_per_frame * f1;
                      f1 *= fr_size;
                      j = (btime - time1) / ((time1 + time_per_frame) - time1);
                      fr_size++;

                      f1 -= 1;
                      f2 -= 1;


                    }
                    else {
                      fr_size++;
                      for (fi = 0; fi <= frames.length; fi += fr_size) {
                        if (fi > 0) {
                          if (btime >= j && btime <= frames[fi] + 0.000001) {
                            pi = fi;
                            break;
                          }
                        }
                        j = frames[fi];
                      }
                      f1 = pi - fr_size;
                      f2 = pi;
                      j = (btime - frames[f1]) / (frames[f2] - frames[f1]);

                    }



                    if (fr_size === 2) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                    }
                    else if (fr_size === 3) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                      fvalues[1] = frames[f1 + 2] + (frames[f2 + 2] - frames[f1 + 2]) * j;
                    }
                    else if (fr_size === 4) {
                      fvalues[0] = frames[f1 + 1] + (frames[f2 + 1] - frames[f1 + 1]) * j;
                      fvalues[1] = frames[f1 + 2] + (frames[f2 + 2] - frames[f1 + 2]) * j;
                      fvalues[2] = frames[f1 + 3] + (frames[f2 + 3] - frames[f1 + 3]) * j;
                    }
                    else if (fr_size === 5) {
                      S5$cosom = frames[f1 + 1] * frames[f2 + 1] + frames[f1 + 2] * frames[f2 + 2] + frames[f1 + 3] * frames[f2 + 3] + frames[f1 + 4] * frames[f2 + 4];

      if (S5$cosom < 0.0) {
        S5$cosom = -S5$cosom;
        frames[f2 + 1] = -frames[f2 + 1];
        frames[f2 + 2] = -frames[f2 + 2];
        frames[f2 + 3] = -frames[f2 + 3];
        frames[f2 + 4] = -frames[f2 + 4];
      }

      
      if (1.0 - S5$cosom > 0.000001) {

        S5$omega = Math.acos(S5$cosom);
        S5$sinom = Math.sin(S5$omega);
        S5$scale0 = Math.sin((1.0 - j) * S5$omega) / S5$sinom;
        S5$scale1 = Math.sin(j * S5$omega) / S5$sinom;

      } else {       
        S5$scale0 = 1.0 - j;
        S5$scale1 = j;
      }


      fvalues[0] = S5$scale0 * frames[f1 + 1] + S5$scale1 * frames[f2 + 1];
      fvalues[1] = S5$scale0 * frames[f1 + 2] + S5$scale1 * frames[f2 + 2];
      fvalues[2] = S5$scale0 * frames[f1 + 3] + S5$scale1 * frames[f2 + 3];
      fvalues[3] = S5$scale0 * frames[f1 + 4] + S5$scale1 * frames[f2 + 4];;
                    }

                    for (fi = 0; fi < fr_size - 1; fi++) {

                      output_channel.data[block.oi + fi] += (fvalues[fi] * weight);
                    }
                    output_channel.di = Math.max(output_channel.di, block.oi + fr_size);
                  }



                }
              }


            })();


            sys.animations = {};

            sys.ai = 0;

            sys.animation_sessions = {
              pool: new fin.object_pooler(function () {
                var asess = {
                  anim: null,
                };
                
                return asess;
              }),
              active: new fin.ping_pong_array("queue", "updates")
            };

            sys.output_channels = [];

            sys.begin_step = function (m) {

              if (m.data.length === undefined) {
                if (m.data.op === "create_animation") {
                  sys.animations[m.data.id] = m.data;
                }
                return false;
              }
              
            }

            var anim, asess, aid;
            sys.run_command = function (cmd, dt, ci) {

              if (cmd === 1000) { //trigger animation
                aid = dt[ci++];
                anim = this.animations[aid];
                if (anim) {
                  asess = this.animation_sessions.pool.get();
                  asess.anim = anim;
                  asess.life_start = sys.time;
                  asess.duration = dt[ci++];
                  asess.repeat = dt[ci++];
                  asess.oid = dt[ci++];
                  asess.weight = dt[ci++];
                  if (!this.output_channels[asess.oid]) {
                    this.output_channels[asess.oid] = { data: new Float32Array(512), di: 0 };
                  }
                  asess.life = asess.duration * asess.repeat;
                  this.animation_sessions.active.queue[this.ai++] = asess;
                  
                }

              }

            };


            var ai = 0, clock, output_channel,ii=0;
            sys.submit_data = function (dt) {

              var aqueue = this.animation_sessions.active.queue;
              var aupdate = this.animation_sessions.active.updates;
              var time = this.time;
              ai = 0;

              for (ai = 0; ai < this.output_channels.length; ai++) {
                output_channel = this.output_channels[ai];
                if (output_channel) {
                  output_channel.data.fill(0);
                  output_channel.di = 0;
                }
              }
              ai = 0;
              while (this.ai > 0) {
                asess = aqueue[--this.ai];
                aqueue[this.ai] = undefined;
                clock=time - asess.life_start
                if (asess.life < 0 || clock < asess.life) {
                  this.play_animation(asess.anim, clock % asess.duration / asess.duration, asess.oid, asess.weight);
                 
                  aupdate[ai++] = asess;
                }
                else {
                  asess.anim = undefined;
                  this.animation_sessions.pool.free(asess);
                  console.log(asess);
                }
              }

              this.ai = ai;
              this.animation_sessions.active.swap();

              dt[0] = 0;
              ci = 1;
              for (ai = 0; ai < this.output_channels.length; ai++) {
                output_channel = this.output_channels[ai];
                if (output_channel && output_channel.di > 0) {

                  dt[ci++] = ai;
                  dt[ci++] = output_channel.di;
                  for (ii = 0; ii < output_channel.di; ii++) {
                    dt[ci++] = output_channel.data[ii];
                  }
                }


              }
              if (ci > 1) dt[0] = ci;

            };
            console.log(sys);
          }
        ]
      });


      
      this.worker.commands_group(function (self, cmd, worker) {

        self.trigger_animation = function (aid, duration, repeat,oid,weight) {
          worker.set_command(1000, 5);
          cmd[worker.ci++] = aid;
          oid = oid || 0;
          cmd[worker.ci++] = duration;
          cmd[worker.ci++] = repeat;
          cmd[worker.ci++] = oid;
          cmd[worker.ci++] = weight || 1;

          output_channel = self.output_channels[oid];
          if (!output_channel) {
            output_channel = { di: 0, data: new Float32Array(512) };
            self.output_channels[oid] = output_channel;
          }

          return output_channel;
        }
      }, this);
      var output_channel;
      self.output_channels = [];
      this.worker.on_data = (function (dt) {
        var ci, oid = 0, ii = 0;

        return function (dt) {
          ci = 1;
          while (ci < dt[0]) {
            oid = dt[ci++];
            output_channel = self.output_channels[oid];
            output_channel.di = dt[ci++]
            for (ii = 0; ii < output_channel.di; ii++) {
              output_channel.data[ii] = dt[ci++];

            }


          }

        }


      })();
    }




    return worker_animation_system;



  }, ecs.system));
}})()(_FM["fin"],_FM["ge"],_FM["ecs"],_FM["math"]);
(function() { return function camera(ge, ecs, math) { 


  


  ecs.register_component("ge_camera", ge.define(function (proto, _super) {

    proto.update_aspect = function (asp) {
      this.aspect = asp;
      this.update_view_projection = 1;
    };


    proto.set_projection = function (mat) {
      this.projection = mat;
      math.mat4.multiply(this.view_projection, mat, this.view_inverse);
    }
    var len = 0;
    proto.update_frustum_plane = function (p, x, y, z, w) {
      len = x * x + y * y + z * z + w * w;
      len = 1 / Math.sqrt(len);
      this.frustum_plans[p][0] = x * len;
      this.frustum_plans[p][1] = y * len;
      this.frustum_plans[p][2] = z * len;
      this.frustum_plans[p][3] = w * len;
    };
    proto.calc_bounds = (function () {
      var minx, miny, minz, maxx, maxy, maxz;
      function update_bounds(x, y, z) {
        minx = Math.min(minx, x);
        miny = Math.min(miny, y);
        minz = Math.min(minz, z);

        maxx = Math.max(maxx, x);
        maxy = Math.max(maxy, y);
        maxz = Math.max(maxz, z);


      }
      return function () {

        var half_height = Math.tan((this.fov / 2.0));
        var half_width = half_height * this.aspect;
        var xn = half_width * this.near;
        var xf = half_width * this.far;
        var yn = half_width * this.near;
        var yf = half_width * this.far;


        minx = 99999;
        miny = 99999;
        minz = 99999;

        maxx = -99999;
        maxy = -99999;
        maxz = -99999;



        update_bounds(-xn, -yn, this.near);
        update_bounds(xn, -yn, this.near);
        update_bounds(xn, yn, this.near);
        update_bounds(-xn, yn, this.near);


        update_bounds(-xf, -yf, -this.far);
        update_bounds(xf, -yf, -this.far);
        update_bounds(xf, yf, -this.far);
        update_bounds(-xf, yf, -this.far);



        this._bounds[0] = minx;
        this._bounds[1] = miny;
        this._bounds[2] = minz;


        this._bounds[3] = maxx;
        this._bounds[4] = maxy;
        this._bounds[5] = maxz;



      }
    })();
    proto.update_frustum = function (me) {
      math.aabb.transform_mat4(this.bounds, this._bounds, this.view);
      //RIGHT
      this.update_frustum_plane(0, me[3] - me[0], me[7] - me[4], me[11] - me[8], me[15] - me[12]);
      //LEFT
      this.update_frustum_plane(1, me[3] + me[0], me[7] + me[4], me[11] + me[8], me[15] + me[12]);
      //BOTTOM
      this.update_frustum_plane(2, me[3] + me[1], me[7] + me[5], me[11] + me[9], me[15] + me[13]);
      //TOP
      this.update_frustum_plane(3, me[3] - me[1], me[7] - me[5], me[11] - me[9], me[15] - me[13]);
      //FAR
      this.update_frustum_plane(4, me[3] - me[2], me[7] - me[6], me[11] - me[10], me[15] - me[14]);
      //NEAR
      this.update_frustum_plane(5, me[3] + me[2], me[7] + me[6], me[11] + me[10], me[15] + me[14]);


    };

    proto.frustum_aabb = (function () {
      
      proto._frustum_aabb = function (minx, miny, minz, maxx, maxy, maxz) {
        var p = 0, plane;
        for (var p = 0; p < 6; p++) {
          plane = this.frustum_plans[p];
          if ((Math.max(minx * plane[0], maxx * plane[0])
            + Math.max(miny * plane[1], maxy * plane[1])
            + Math.max(minz * plane[2], maxz * plane[2])
            + plane[3]) < 0) return false;

        }
        return true;
      };

      return function (aabb) {
        return this._frustum_aabb(aabb[0], aabb[1], aabb[2], aabb[3], aabb[4], aabb[5]);
      }

    })();

    proto.aabb_aabb = (function () {
      var a;
      return function (b) {
        a = this.bounds;
        return (a[0] <= b[3] && a[3] >= b[0]) &&
          (a[1] <= b[4] && a[4] >= b[1]) &&
          (a[2] <= b[5] && a[5] >= b[2]);
      }

    })();


    proto.get_mouse_ray_pos = (function () {
      var v = math.vec4(), start = math.vec3();

      proto.set_drag_direction = function (mouse_x, mouse_y, width, height) {
        v[0] = (mouse_x / width) * 2 - 1;
        v[1] = -(mouse_y / height) * 2 + 1;
        v[2] = -1;
        math.vec3.transform_mat4(start, v, this.view_projection_inverse);
        v[2] = 1;
        math.vec3.transform_mat4(v, v, this.view_projection_inverse);

        math.vec3.subtract(this.drag_direction, v, this.last_drag_direction);
        this.drag_magnitude = math.vec3.get_length(this.drag_direction);

        math.vec3.normalize(this.drag_direction, this.drag_direction);
        math.vec3.copy(this.last_drag_direction, v);
        return this.drag_direction;

      };

      return function (mouse_ray_pos, mouse_x, mouse_y, width, height) {
        v[0] = (mouse_x / width) * 2 - 1;
        v[1] = -(mouse_y / height) * 2 + 1;
        v[2] = -1;

        math.vec3.transform_mat4(start, v, this.view_projection_inverse);
        v[2] = 1;
        math.vec3.transform_mat4(mouse_ray_pos, v, this.view_projection_inverse);
        return mouse_ray_pos;


      }

    })();

    proto.set_freez_projection = function (proj) {
      math.mat4.copy(this.projection, proj);
      this.freez_projection = true;
      this.update_view_projection = 1;
    };

    proto.move_front_back = function (sp) {
      this.entity.transform.add_pos(this.fw_vector[0] * sp, this.fw_vector[1] * sp, this.fw_vector[2] * sp);
      return (this);
    };

    proto.yaw_pitch = function (dx, dy) {
      this.eular[0] += dx;
      this.eular[1] += dy;
      this.entity.transform.set_eular(this.eular[0], this.eular[1], this.eular[2]);
      return (this);
    };

    function ge_camera(def, en, app, comp) {
      _super.apply(this, arguments);

      this.view = math.mat4();
      this.view_inverse = math.mat4();
      this.projection = math.mat4();
      this.projection_inverse = math.mat4();
      this.view_projection = math.mat4();
      this.view_projection_inverse = math.mat4();

      this.freez_projection = false;
      this.version = 0;

      this.up_vector = new Float32Array(this.view.buffer, (4 * 4), 3);
      this.fw_vector = new Float32Array(this.view.buffer, (8 * 4), 3);
      this.sd_vector = new Float32Array(this.view.buffer, 0, 3);

      this.frustum_plans = [math.vec4(), math.vec4(), math.vec4(), math.vec4(), math.vec4(), math.vec4()];
      this.world_position = new Float32Array(this.view.buffer, (12 * 4), 3);

      this.bounds = math.aabb();
      this._bounds = math.aabb();
      this.eular = def.eular || [0, 0, 0];
      this.is_locked = false;
      this.entity = en;
      this.update_view_projection = true;
      this.type = def.type || "perspective";
      if (this.type === "perspective") {
        this.fov = (def.fov !== undefined ? def.fov : 60) * 0.017453292519943295;
        this.near = def.near !== undefined ? def.near : 0.1;
        this.far = def.far !== undefined ? def.far : 20000;
        this.aspect = def.aspect !== undefined ? def.aspect : 1;
      }
      else {
        this.left = def.left || -0.5;
        this.right = def.right || 0.5;
        this.bottom = def.bottom || -0.5;
        this.top = def.top || 0.5;
        this.near = def.near || 0.1;
        this.far = def.far || 20;

        this.aspect = Math.abs((this.right - this.left) / (this.top - this.bottom));
      }

      this.vp_left = 0;
      this.vp_top = 0;
      this.vp_width = 1;
      this.vp_height = 1;




      this.drag_direction = math.vec3();
      this.last_drag_direction = math.vec3();
      this.version = 0;
      this.update_view_projection = 1;
      this.on_drage = new ge.event(this, [0, 0, null]);
    }

    ge_camera.validate = function (comp) {
      comp.app.use_system('ge_camera_system');
    };

    return ge_camera;

  }, ecs.component));

  ecs.register_component('ge_mouse_camera_controller', fin.define(function (proto, _super) {



    proto.mouse_wheel = function (sp, e) {

      this.on_mouse_wheel.params[0] = sp;
      this.on_mouse_wheel.params[1] = e;
      if (this.on_mouse_wheel.trigger_params() === false) return;


      if (this.entity.ge_camera.is_locked) return;
      this.entity.ge_camera.move_front_back(-this.wheel_delta * sp);

    };


    proto.get_mouse_camera_pos = function (pos) {
      this.entity.ge_camera.get_mouse_ray_pos(pos, this.mouse_x, this.mouse_y, this.elm_rect.width, this.elm_rect.height);
    }
    proto.mouse_drage = function (dx, dy, e) {
      
      this.entity.ge_camera.set_drag_direction(this.mouse_x, this.mouse_y, this.elm_rect.width, this.elm_rect.height);

      this.on_mouse_drage.params[0] = dx;
      this.on_mouse_drage.params[1] = dy;
      this.on_mouse_drage.params[2] = e;
      if (this.entity.ge_camera.on_drage.trigger(this.on_mouse_drage.params) === false) return;
      if (this.on_mouse_drage.trigger_params() === false) return;
      if (this.entity.ge_camera.is_locked) return;

      this.entity.ge_camera.yaw_pitch(-dy * 0.005, -dx * 0.005);



    };

    proto.mouse_click = proto.mouse_move = function (x, y, e) { };



    proto.mouse_move2 = function (x, y, e) {
      this.entity.ge_camera.get_mouse_ray_pos(this.mouse_camera_ray_pos, this.mouse_x, this.mouse_y, this.elm_rect.width, this.elm_rect.height);
      math.vec3.subtract(this.mouse_camera_ray, this.mouse_camera_ray_pos, this.entity.ge_camera.world_position);
      math.vec3.normalize(this.mouse_camera_ray, this.mouse_camera_ray);
    };

    proto.mouse_down = function (x, y, e) {
      this.on_mouse_down.params[0] = x;
      this.on_mouse_down.params[1] = y;
      this.on_mouse_down.params[2] = e;
      this.on_mouse_down.trigger_params();
    }

    proto.mouse_up = function (x, y, e) {
      this.on_mouse_up.params[0] = x;
      this.on_mouse_up.params[1] = y;
      this.on_mouse_up.params[2] = e;
      this.on_mouse_up.trigger_params();
    }
  
    proto.mouse_drage2 = function (dx, dy, e) { };

    proto.set_mouse_input = function (elm) {
      var _this = this;
      this.elm_rect = elm.getBoundingClientRect();

      elm.addEventListener((/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel", function (e) {
        _this.mouse_wheel(e.detail ? e.detail * (-120) : e.wheelDelta, e);
      }, false);

      var x = 0, y = 0, rect = null;

      function setup_mouse_down(clientX, clientY, e) {
        this.elm_rect = elm.getBoundingClientRect();
        rect = this.elm_rect;
        x = clientX - rect.left;
        y = clientY - rect.top;
        _this.elm_width = rect.right - rect.left;
        _this.elm_height = rect.bottom - rect.top;
        _this.mouse_buttons = e.buttons;
        _this.mouse_down_x = x;
        _this.mouse_down_y = y;
        _this.mouse_down(_this.mouse_down_x, _this.mouse_down_y, e);
        _this.mouse_delta = 1;
        _this.mouse_is_down = true;
        _this.mouse_is_up = false;
      }
      function setup_mouse_up(e) {
        _this.mouse_buttons = 0;
        _this.mouse_is_up = true;
        _this.mouse_is_down = false;
        _this.mouse_up(_this.mouse_x, _this.mouse_y, e);
      }


      function setup_mouse_move(clientX, clientY, buttonDown, e) {
        rect = elm.getBoundingClientRect();
        x = clientX - rect.left;
        y = clientY - rect.top;

        _this.elm_width = rect.right - rect.left;
        _this.elm_height = rect.bottom - rect.top;

        _this.mouse_buttons = e.buttons;
        _this.mouse_x = x;
        _this.mouse_y = y;
        _this.mouse_draging = false;
        _this.mouse_move(_this.mouse_x, _this.mouse_y, e);

        if (buttonDown) {
          _this.mouse_down_x = _this.mouse_down_x || x;
          _this.mouse_down_y = _this.mouse_down_y || y;


          _this.mouse_dx = (x - _this.mouse_down_x);
          _this.mouse_dy = (y - _this.mouse_down_y);
          _this.mouse_drage(_this.mouse_dx, _this.mouse_dy, e);

          _this.mouse_down_x = x;
          _this.mouse_down_y = y;
          _this.mouse_draging = true;

        }
      }

      elm.addEventListener('mousedown', function (e) {
        setup_mouse_down(e.clientX, e.clientY, e);

      });
      elm.addEventListener('click', function (e) {

        _this.mouse_click(_this.mouse_x, _this.mouse_y, e);
      });
      elm.addEventListener('mouseup', function (e) {
        setup_mouse_up(e);
      });

      elm.addEventListener('mousemove', function (e) {
        setup_mouse_move(e.clientX, e.clientY, e.buttons == 1, e)
      });


      
      elm.addEventListener('touchend', function (e) {
        setup_mouse_up(e);
        e.stopPropagation();
        e.preventDefault();
      });

      var last_pinch = 0,current_pinch, pnx, pny;

      elm.addEventListener('touchstart', function (e) {


        if (e.touches.length === 1) {
          setup_mouse_down(e.touches[0].clientX, e.touches[0].clientY, e);
        }
        else if (e.touches.length === 2) {
          pnx = e.touches[0].clientX - e.touches[1].clientX;
          pny = e.touches[0].clientY - e.touches[1].clientY;
          last_pinch = Math.sqrt(pnx * pnx + pny * pny);
        }

        e.stopPropagation();
        e.preventDefault();
      });

      elm.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) {
          setup_mouse_move(e.touches[0].clientX, e.touches[0].clientY, true, e);
        }
        else if (e.touches.length === 2) {

          pnx = e.touches[0].clientX - e.touches[1].clientX;
          pny = e.touches[0].clientY - e.touches[1].clientY;

          current_pinch = Math.sqrt(pnx * pnx + pny * pny);
          if (current_pinch > last_pinch) {
            _this.mouse_wheel(_this.pinch_wheel_delta, e);
          }
          else {
            _this.mouse_wheel(-_this.pinch_wheel_delta, e);
          }
          last_pinch = current_pinch;

          
        }
      
        e.stopPropagation();
        e.preventDefault();
      });

    }

    proto.set_mouse_ray = function () {
      math.vec3.copy(this.mouse_ray_start, this.entity.ge_camera.world_position);
      this.entity.ge_camera.get_mouse_ray_pos(this.mouse_ray_end, this.mouse_x, this.mouse_y, this.elm_rect.width, this.elm_rect.height);
    };
   
    function ge_mouse_camera_controller(def, en, app, comp) {
      this.entity = en;


      this.element = def.element;
      this.wheel_delta = def.wheel_delta || 0.25;
      this.pinch_wheel_delta = def.pinch_wheel_delta || 30;
      this.set_mouse_input(this.element);
      this.mouse_camera_ray_pos = math.vec3();
      this.mouse_camera_ray = math.vec3();
      this.on_mouse_down = new ge.event(this,[0,0,null]);
      this.on_mouse_up = new ge.event(this, [0, 0, null]);
      this.on_mouse_drage = new ge.event(this, [0, 0, null]);
      this.on_mouse_wheel = new ge.event(this, [0,  null]);

      this.mouse_ray_start = math.vec3();
      this.mouse_ray_end = math.vec3();
     
      this.suspended = false;
      if (def.on_mouse_down) {
        this.on_mouse_down.add(def.on_mouse_down);
      }
        
      if (def.on_mouse_up) {
        this.on_mouse_up.add(def.on_mouse_up);
      }

      if (def.on_mouse_drage) {
        this.on_mouse_drage.add(def.on_mouse_drage);
      }
      if (def.on_mouse_wheel) {
        this.on_mouse_wheel.add(def.on_mouse_wheel);
      }
    }

    ge_mouse_camera_controller.validate = function (comp) {
      comp.app.use_system('ge_camera_system');


    };
    return ge_mouse_camera_controller;



  }, ecs.component));


  ecs.register_component('ge_keyboard_camera_controller', fin.define(function (proto, _super) {



    proto.set_keyboard_input = function (elm) {
      var _this = this;    
      _this.keys = [];

      elm.addEventListener('keydown', function (e) {
        _this.keys[e.keyCode] = true;
        _this.shift_key = e.shiftKey;
        _this.key_down = true;
      });

      elm.addEventListener('keyup', function (e) {
        _this.keys[e.keyCode] = false;
        _this.shift_key = e.shiftKey;
        _this.key_down = false;
        
      });

     
    }

    proto.update = function () {      
      if (this.keys[87]) {
        if (this.shift_key) {
          this.entity.ge_transform_controller.move_front_back(-this.front_back_delta*4);

        }
        else {
          this.entity.ge_transform_controller.move_front_back(-this.front_back_delta);

        }
        this.entity.ge_transform.require_update = -1;
      }

      if (this.keys[83]) {

        if (this.shift_key) {
          this.entity.ge_transform_controller.move_front_back(this.front_back_delta*4);

        }
        else {
          this.entity.ge_transform_controller.move_front_back(this.front_back_delta);


        }
         this.entity.ge_transform.require_update = -1;
      }

      if (this.key_down) {
        if (this.on_key_down) this.on_key_down(this.keys);
      }

    }

   

    function ge_keyboard_camera_controller(def, en, app, comp) {
      this.entity = en;

      console.log(en);
      this.element = def.element;
      this.front_back_delta = def.front_back_delta || 1;
      this.shift_key = false;
      this.set_keyboard_input(this.element);
      this.key_down = false;
      this.on_key_down = def.on_key_down;
    }

    ge_keyboard_camera_controller.validate = function (comp) {
      comp.app.use_system('ge_camera_system');
      comp.app.use_system('ge_render_system');


    };
    return ge_keyboard_camera_controller;



  }, ecs.component));


  ecs.register_system("ge_camera_system", ge.define(function (proto, _super) {
    

    var trans = null, cam = null, entity = null;
    var S3$a00,S3$a01,S3$a02,S3$a03,S3$a10,S3$a11,S3$a12,S3$a13,S3$a20,S3$a21,S3$a22,S3$a23,S3$a30,S3$a31,S3$a32,S3$a33,S3$det,S3$b00,S3$b01,S3$b02,S3$b03,S3$b04,S3$b05,S3$b06,S3$b07,S3$b08,S3$b09,S3$b10,S3$b11,S3$mat1,S3$mat2,S3$a05,S3$a06,S3$a07,S3$vec1,S3$mat3;
    proto.step = function () {

      while ((entity = this.app.iterate_entities("ge_keyboard_camera_controller")) !== null) {
        entity.ge_keyboard_camera_controller.update();
      }

      while ((entity = this.app.iterate_entities("ge_camera")) !== null) {
        cam = entity.ge_camera;
        trans = entity.transform;
        if (cam.update_view_projection === 1) {
          if (!cam.freez_projection) {
            if (cam.type === "perspective") {
              math.mat4.perspective(cam.projection, cam.fov, cam.aspect, cam.near, cam.far);
            }
            else {
              math.mat4.ortho(cam.projection, cam.left, cam.right, cam.bottom, cam.top, cam.near, cam.far);
            }
          }
         
          S3$mat1 = cam.projection_inverse;
      S3$mat2 = cam.projection;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$a00 * S3$a11 - S3$a01 * S3$a10;
      S3$b01 = S3$a00 * S3$a12 - S3$a02 * S3$a10;
      S3$b02 = S3$a00 * S3$a13 - S3$a03 * S3$a10;
      S3$b03 = S3$a01 * S3$a12 - S3$a02 * S3$a11;
      S3$b04 = S3$a01 * S3$a13 - S3$a03 * S3$a11;
      S3$b05 = S3$a02 * S3$a13 - S3$a03 * S3$a12;
      S3$b06 = S3$a20 * S3$a31 - S3$a21 * S3$a30;
      S3$b07 = S3$a20 * S3$a32 - S3$a22 * S3$a30;
      S3$b08 = S3$a20 * S3$a33 - S3$a23 * S3$a30;
      S3$b09 = S3$a21 * S3$a32 - S3$a22 * S3$a31;
      S3$b10 = S3$a21 * S3$a33 - S3$a23 * S3$a31;
      S3$b11 = S3$a22 * S3$a33 - S3$a23 * S3$a32;

      S3$det = S3$b00 * S3$b11 - S3$b01 * S3$b10 + S3$b02 * S3$b09 + S3$b03 * S3$b08 - S3$b04 * S3$b07 + S3$b05 * S3$b06;

      if (S3$det) {
        S3$det = 1.0 / S3$det;

        S3$mat1[0] = (S3$a11 * S3$b11 - S3$a12 * S3$b10 + S3$a13 * S3$b09) * S3$det;
        S3$mat1[1] = (S3$a02 * S3$b10 - S3$a01 * S3$b11 - S3$a03 * S3$b09) * S3$det;
        S3$mat1[2] = (S3$a31 * S3$b05 - S3$a32 * S3$b04 + S3$a33 * S3$b03) * S3$det;
        S3$mat1[3] = (S3$a22 * S3$b04 - S3$a21 * S3$b05 - S3$a23 * S3$b03) * S3$det;
        S3$mat1[4] = (S3$a12 * S3$b08 - S3$a10 * S3$b11 - S3$a13 * S3$b07) * S3$det;
        S3$mat1[5] = (S3$a00 * S3$b11 - S3$a02 * S3$b08 + S3$a03 * S3$b07) * S3$det;
        S3$mat1[6] = (S3$a32 * S3$b02 - S3$a30 * S3$b05 - S3$a33 * S3$b01) * S3$det;
        S3$mat1[7] = (S3$a20 * S3$b05 - S3$a22 * S3$b02 + S3$a23 * S3$b01) * S3$det;
        S3$mat1[8] = (S3$a10 * S3$b10 - S3$a11 * S3$b08 + S3$a13 * S3$b06) * S3$det;
        S3$mat1[9] = (S3$a01 * S3$b08 - S3$a00 * S3$b10 - S3$a03 * S3$b06) * S3$det;
        S3$mat1[10] = (S3$a30 * S3$b04 - S3$a31 * S3$b02 + S3$a33 * S3$b00) * S3$det;
        S3$mat1[11] = (S3$a21 * S3$b02 - S3$a20 * S3$b04 - S3$a23 * S3$b00) * S3$det;
        S3$mat1[12] = (S3$a11 * S3$b07 - S3$a10 * S3$b09 - S3$a12 * S3$b06) * S3$det;
        S3$mat1[13] = (S3$a00 * S3$b09 - S3$a01 * S3$b07 + S3$a02 * S3$b06) * S3$det;
        S3$mat1[14] = (S3$a31 * S3$b01 - S3$a30 * S3$b03 - S3$a32 * S3$b00) * S3$det;
        S3$mat1[15] = (S3$a20 * S3$b03 - S3$a21 * S3$b01 + S3$a22 * S3$b00) * S3$det;
      }
        }

        if (trans.updated) {

          cam.version = ((cam.version | 0) + 1) % (99999 | 0);

          S3$mat1 = cam.view;
      S3$vec1 = trans.rot;

      S3$a00 = S3$vec1[0]; S3$a01 = S3$vec1[1]; S3$a02 = S3$vec1[2]; S3$a03 = S3$vec1[3];
      S3$a05 = S3$a00 + S3$a00;
      S3$a06 = S3$a01 + S3$a01;
      S3$a07 = S3$a02 + S3$a02;

      S3$b00 = S3$a00 * S3$a05;
      S3$b01 = S3$a00 * S3$a06;
      S3$b02 = S3$a00 * S3$a07;
      S3$b03 = S3$a01 * S3$a06;
      S3$b04 = S3$a01 * S3$a07;
      S3$b05 = S3$a02 * S3$a07;
      S3$b06 = S3$a03 * S3$a05;
      S3$b07 = S3$a03 * S3$a06;
      S3$b08 = S3$a03 * S3$a07;


      S3$mat1[0] = (1 - (S3$b03 + S3$b05));
      S3$mat1[1] = (S3$b01 + S3$b08);
      S3$mat1[2] = (S3$b02 - S3$b07);
      S3$mat1[3] = 0;
      S3$mat1[4] = (S3$b01 - S3$b08);
      S3$mat1[5] = (1 - (S3$b00 + S3$b05));
      S3$mat1[6] = (S3$b04 + S3$b06);
      S3$mat1[7] = 0;
      S3$mat1[8] = (S3$b02 + S3$b07);
      S3$mat1[9] = (S3$b04 - S3$b06);
      S3$mat1[10] = (1 - (S3$b00 + S3$b03));
      S3$mat1[11] = 0;

          S3$mat1 = cam.view;
      S3$vec1 = trans.scale;


      S3$mat1[0] *= S3$vec1[0];
      S3$mat1[1] *= S3$vec1[0];
      S3$mat1[2] *= S3$vec1[0];
      S3$mat1[3] *= S3$vec1[0];

      S3$mat1[4] *= S3$vec1[1];
      S3$mat1[5] *= S3$vec1[1];
      S3$mat1[6] *= S3$vec1[1];
      S3$mat1[7] *= S3$vec1[1];


      S3$mat1[8] *= S3$vec1[2];
      S3$mat1[9] *= S3$vec1[2];
      S3$mat1[10] *= S3$vec1[2];
      S3$mat1[11] *= S3$vec1[2];

          cam.view[12] = trans.pos[0];
          cam.view[13] = trans.pos[1];
          cam.view[14] = trans.pos[2];


          cam.update_view_projection = 1;
        }

        if (cam.update_view_projection === 1) {
          cam.version = ((cam.version | 0) + 1) % (99999 | 0);
          cam.update_view_projection = 0;

          S3$mat1 = cam.view_inverse;
      S3$mat2 = cam.view;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$a00 * S3$a11 - S3$a01 * S3$a10;
      S3$b01 = S3$a00 * S3$a12 - S3$a02 * S3$a10;
      S3$b02 = S3$a00 * S3$a13 - S3$a03 * S3$a10;
      S3$b03 = S3$a01 * S3$a12 - S3$a02 * S3$a11;
      S3$b04 = S3$a01 * S3$a13 - S3$a03 * S3$a11;
      S3$b05 = S3$a02 * S3$a13 - S3$a03 * S3$a12;
      S3$b06 = S3$a20 * S3$a31 - S3$a21 * S3$a30;
      S3$b07 = S3$a20 * S3$a32 - S3$a22 * S3$a30;
      S3$b08 = S3$a20 * S3$a33 - S3$a23 * S3$a30;
      S3$b09 = S3$a21 * S3$a32 - S3$a22 * S3$a31;
      S3$b10 = S3$a21 * S3$a33 - S3$a23 * S3$a31;
      S3$b11 = S3$a22 * S3$a33 - S3$a23 * S3$a32;

      S3$det = S3$b00 * S3$b11 - S3$b01 * S3$b10 + S3$b02 * S3$b09 + S3$b03 * S3$b08 - S3$b04 * S3$b07 + S3$b05 * S3$b06;

      if (S3$det) {
        S3$det = 1.0 / S3$det;

        S3$mat1[0] = (S3$a11 * S3$b11 - S3$a12 * S3$b10 + S3$a13 * S3$b09) * S3$det;
        S3$mat1[1] = (S3$a02 * S3$b10 - S3$a01 * S3$b11 - S3$a03 * S3$b09) * S3$det;
        S3$mat1[2] = (S3$a31 * S3$b05 - S3$a32 * S3$b04 + S3$a33 * S3$b03) * S3$det;
        S3$mat1[3] = (S3$a22 * S3$b04 - S3$a21 * S3$b05 - S3$a23 * S3$b03) * S3$det;
        S3$mat1[4] = (S3$a12 * S3$b08 - S3$a10 * S3$b11 - S3$a13 * S3$b07) * S3$det;
        S3$mat1[5] = (S3$a00 * S3$b11 - S3$a02 * S3$b08 + S3$a03 * S3$b07) * S3$det;
        S3$mat1[6] = (S3$a32 * S3$b02 - S3$a30 * S3$b05 - S3$a33 * S3$b01) * S3$det;
        S3$mat1[7] = (S3$a20 * S3$b05 - S3$a22 * S3$b02 + S3$a23 * S3$b01) * S3$det;
        S3$mat1[8] = (S3$a10 * S3$b10 - S3$a11 * S3$b08 + S3$a13 * S3$b06) * S3$det;
        S3$mat1[9] = (S3$a01 * S3$b08 - S3$a00 * S3$b10 - S3$a03 * S3$b06) * S3$det;
        S3$mat1[10] = (S3$a30 * S3$b04 - S3$a31 * S3$b02 + S3$a33 * S3$b00) * S3$det;
        S3$mat1[11] = (S3$a21 * S3$b02 - S3$a20 * S3$b04 - S3$a23 * S3$b00) * S3$det;
        S3$mat1[12] = (S3$a11 * S3$b07 - S3$a10 * S3$b09 - S3$a12 * S3$b06) * S3$det;
        S3$mat1[13] = (S3$a00 * S3$b09 - S3$a01 * S3$b07 + S3$a02 * S3$b06) * S3$det;
        S3$mat1[14] = (S3$a31 * S3$b01 - S3$a30 * S3$b03 - S3$a32 * S3$b00) * S3$det;
        S3$mat1[15] = (S3$a20 * S3$b03 - S3$a21 * S3$b01 + S3$a22 * S3$b00) * S3$det;
      }

          S3$mat1 = cam.view_projection;
      S3$mat2 = cam.projection;
      S3$mat3 = cam.view_inverse;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$mat3[0]; S3$b01 = S3$mat3[1]; S3$b02 = S3$mat3[2]; S3$b03 = S3$mat3[3];
      S3$mat1[0] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[1] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[2] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[3] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[4]; S3$b01 = S3$mat3[5]; S3$b02 = S3$mat3[6]; S3$b03 = S3$mat3[7];
      S3$mat1[4] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[5] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[6] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[7] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[8]; S3$b01 = S3$mat3[9]; S3$b02 = S3$mat3[10]; S3$b03 = S3$mat3[11];
      S3$mat1[8] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[9] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[10] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[11] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[12]; S3$b01 = S3$mat3[13]; S3$b02 = S3$mat3[14]; S3$b03 = S3$mat3[15];
      S3$mat1[12] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[13] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[14] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[15] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

          S3$mat1 = cam.view_projection_inverse;
      S3$mat2 = cam.view_projection;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$a00 * S3$a11 - S3$a01 * S3$a10;
      S3$b01 = S3$a00 * S3$a12 - S3$a02 * S3$a10;
      S3$b02 = S3$a00 * S3$a13 - S3$a03 * S3$a10;
      S3$b03 = S3$a01 * S3$a12 - S3$a02 * S3$a11;
      S3$b04 = S3$a01 * S3$a13 - S3$a03 * S3$a11;
      S3$b05 = S3$a02 * S3$a13 - S3$a03 * S3$a12;
      S3$b06 = S3$a20 * S3$a31 - S3$a21 * S3$a30;
      S3$b07 = S3$a20 * S3$a32 - S3$a22 * S3$a30;
      S3$b08 = S3$a20 * S3$a33 - S3$a23 * S3$a30;
      S3$b09 = S3$a21 * S3$a32 - S3$a22 * S3$a31;
      S3$b10 = S3$a21 * S3$a33 - S3$a23 * S3$a31;
      S3$b11 = S3$a22 * S3$a33 - S3$a23 * S3$a32;

      S3$det = S3$b00 * S3$b11 - S3$b01 * S3$b10 + S3$b02 * S3$b09 + S3$b03 * S3$b08 - S3$b04 * S3$b07 + S3$b05 * S3$b06;

      if (S3$det) {
        S3$det = 1.0 / S3$det;

        S3$mat1[0] = (S3$a11 * S3$b11 - S3$a12 * S3$b10 + S3$a13 * S3$b09) * S3$det;
        S3$mat1[1] = (S3$a02 * S3$b10 - S3$a01 * S3$b11 - S3$a03 * S3$b09) * S3$det;
        S3$mat1[2] = (S3$a31 * S3$b05 - S3$a32 * S3$b04 + S3$a33 * S3$b03) * S3$det;
        S3$mat1[3] = (S3$a22 * S3$b04 - S3$a21 * S3$b05 - S3$a23 * S3$b03) * S3$det;
        S3$mat1[4] = (S3$a12 * S3$b08 - S3$a10 * S3$b11 - S3$a13 * S3$b07) * S3$det;
        S3$mat1[5] = (S3$a00 * S3$b11 - S3$a02 * S3$b08 + S3$a03 * S3$b07) * S3$det;
        S3$mat1[6] = (S3$a32 * S3$b02 - S3$a30 * S3$b05 - S3$a33 * S3$b01) * S3$det;
        S3$mat1[7] = (S3$a20 * S3$b05 - S3$a22 * S3$b02 + S3$a23 * S3$b01) * S3$det;
        S3$mat1[8] = (S3$a10 * S3$b10 - S3$a11 * S3$b08 + S3$a13 * S3$b06) * S3$det;
        S3$mat1[9] = (S3$a01 * S3$b08 - S3$a00 * S3$b10 - S3$a03 * S3$b06) * S3$det;
        S3$mat1[10] = (S3$a30 * S3$b04 - S3$a31 * S3$b02 + S3$a33 * S3$b00) * S3$det;
        S3$mat1[11] = (S3$a21 * S3$b02 - S3$a20 * S3$b04 - S3$a23 * S3$b00) * S3$det;
        S3$mat1[12] = (S3$a11 * S3$b07 - S3$a10 * S3$b09 - S3$a12 * S3$b06) * S3$det;
        S3$mat1[13] = (S3$a00 * S3$b09 - S3$a01 * S3$b07 + S3$a02 * S3$b06) * S3$det;
        S3$mat1[14] = (S3$a31 * S3$b01 - S3$a30 * S3$b03 - S3$a32 * S3$b00) * S3$det;
        S3$mat1[15] = (S3$a20 * S3$b03 - S3$a21 * S3$b01 + S3$a22 * S3$b00) * S3$det;
      }
          
          if (cam.type === "perspective") {
            
            cam.calc_bounds();
          }
          cam.update_frustum(cam.view_projection);
        }
      }



      

    };

    proto.validate = function (app) {
      this.priority = app.use_system('transform_system').priority + 50;
    };

    function ge_camera_system(def, ecs) {
      _super.apply(this, arguments);

    }

    

    return ge_camera_system;

  }, ecs.system));


}})()(_FM["ge"],_FM["ecs"],_FM["math"]);
(function() { return function index(fin, ge,math) { 

  ge.geometry = {
    shapes: {}
  };

  ge.geometry.geometry_data = ge.define(function (proto) {
    function geometry_data() {
      this.compiled = false;
      this.uuid = fin.guidi();
      this.attributes = {};
      this.version = 0;
      this.bounds_sphere = 0;
      this.aabb = math.aabb();
      this.index_buffer = null;
      this.index_data = null;
      this.origin = math.vec3();
      return (this);
    }
    geometry_data.index_data_type = Uint32Array;
    var temp_indices = new geometry_data.index_data_type(1);
    proto.set_indices = function (indices) {


      if (Object.prototype.toString.call(indices) === Object.prototype.toString.call(temp_indices)) {
        this.index_data = indices;
      }      
      else this.index_data = geometry_data.create_index_data(indices);
      this.index_needs_update = true;
      this.num_items = this.index_data.length;
    };

    proto.add_attribute = function (name, attribute) {
      attribute.buffer = null;
      attribute.item_size = attribute.item_size || 3;
      attribute.data = attribute.data || null;
      attribute.needs_update = attribute.needs_update || false;
      attribute.divisor = attribute.divisor || 0;
      attribute.array = attribute.array || null;
      attribute.data_offset = attribute.data_offset || 0;
      attribute.data_length = attribute.data_length || 0;
      attribute.buffer_type = attribute.buffer_type || 35044;
      attribute.name = name;
      attribute.geo_id = this.uuid;
      if (attribute.data !== null) {
        attribute.data_length = attribute.data.length;
      }
      this.attributes[name] = attribute;
      return (attribute);
    };

    proto.create_instance_id_attribute = function (max_instances) {
      var att = this.add_attribute("a_instance_id_rw", {
        data: new Float32Array(max_instances),
        item_size: 1,
        divisor: 1
      });
      for (var i = 0; i < att.data.length; i++)
        att.data[i] = i;

    }

    proto.convert_to_index_geometry = function () {
      var vertices = this.attributes.a_position_rw.data;
      var normals = this.attributes.a_normal_rw ? this.attributes.a_normal_rw.data : undefined;
      var uvs = this.attributes.a_uv_rw ? this.attributes.a_uv_rw.data : undefined;
      var n_vertices = [], n_normals = [], n_uvs = [];
      var vhash = {}, key;
      var indices = [];
      var i, ii;

      for (i = 0; i < vertices.length; i += 3) {
        key = vertices[i] + ':' + vertices[i + 1] + ':' + vertices[i + 2];
        if (!vhash[key]) {
          vhash[key] = (n_vertices.length / 3) + 1;
          n_vertices.push(vertices[i], vertices[i + 1], vertices[i + 2]);
          if (normals) {
            n_normals.push(normals[i], normals[i + 1], normals[i + 2]);
          }
          if (uvs) {
            ii = (i / 3) * 2;
            n_uvs.push(uvs[ii], uvs[ii + 1]);
          }

        }
        indices.push(vhash[key] - 1)
      }

      var g = geometry_data.create({
        vertices: new Float32Array(n_vertices),
        normals: n_normals.length > 0 ? (new Float32Array(n_normals)) : undefined,
        uvs: n_uvs.length > 0 ? (new Float32Array(n_uvs)) : undefined
      })

      g.set_indices(indices);

      return g;
    }


    proto.auto_normals = function (force) {
      if (!this.attributes.a_normal_rw || force) {
        geometry_data.calc_normals(this);
      }
    }
    proto.clone = function () {
      var g = geometry_data.create({
        vertices: new Float32Array(this.attributes.a_position_rw.data),
        normals: this.attributes.a_normal_rw ? (new Float32Array(this.attributes.a_normal_rw.data)) : undefined,
        uvs: this.attributes.a_uv_rw ? (new Float32Array(this.attributes.a_uv_rw.data)) : undefined



      });
      if (this.index_data !== null) g.set_indices(this.index_data);
      return g;
    }

   


    proto.find_origin = function (draw_offset, draw_count) {
      return geometry_data.find_origin(this.attributes["a_position_rw"].data,
        this.attributes["a_position_rw"].item_size, draw_offset, draw_count
      );
    }

    proto.center_pivot = function (sx, sy, sz, rx, ry, rz) {
      var vert_att =  this.attributes["a_position_rw"];
      return geometry_data.center_pivot(this, sx, sy, sz, rx, ry, rz, vert_att.data, vert_att.data.length, vert_att.item_size);
    }

    proto.scale_position_rotation = function (sx, sy, sz, x, y, z, rx, ry, rz, vert_att) {
      vert_att = vert_att || this.attributes["a_position_rw"]
      geometry_data.scale_position_rotation(sx, sy, sz, x, y, z, rx, ry, rz, vert_att.data, vert_att.data.length, vert_att.item_size);
      geometry_data.calc_bounds(this, vert_att.data, vert_att.data.length, vert_att.item_size);
    }


    

    geometry_data.center_pivot = function (g, sx, sy, sz, rx, ry, rz, vertices, vcount, item_size) {
      var ab = g.aabb;
      geometry_data.scale_position_rotation(1, 1, 1, -ab[0], -ab[1], -ab[2], 0, 0, 0, vertices, vcount, item_size);
      geometry_data.calc_bounds(g, vertices, vcount, item_size);

      ab = g.aabb;
      var width = (ab[3] - ab[0]) * 0.5;
      var height = (ab[4] - ab[1]) * 0.5;
      var depth = (ab[5] - ab[2]) * 0.5;


      geometry_data.scale_position_rotation(1, 1, 1, -width, -height, -depth, 0, 0, 0, vertices, vcount, item_size);
      geometry_data.calc_bounds(g, vertices, vcount, item_size);


      geometry_data.scale_position_rotation(sx, sy, sz, 0, 0, 0, rx, ry, rz, vertices, item_size);
      geometry_data.calc_bounds(g, vertices, vcount, item_size);

      
    }
    geometry_data.create_index_data = function (size) {
      return new this.index_data_type(size);
    };


    geometry_data.scale_position_rotation = (function () {
      var mat = math.mat4(), quat = math.quat();


      return function ( sx, sy, sz, x, y, z, rx, ry, rz, vertices,vcount, item_size) {
        math.quat.rotate_eular(quat, rx, ry, rz);
        math.mat4.from_quat(mat, quat);

        mat[0] *= sx;
        mat[1] *= sy;
        mat[2] *= sz;

        mat[4] *= sx;
        mat[5] *= sy;
        mat[6] *= sz;

        mat[8] *= sx;
        mat[9] *= sy;
        mat[10] *= sz;

        mat[12] = x;
        mat[13] = y;
        mat[14] = z;

        geometry_data.transform(vertices, vcount, item_size, mat);





      }
    })();




    geometry_data.calc_bounds = (function () {
      var p_min = math.vec3(), p_max = math.vec3(), i = 0;
      geometry_data.transform = function (vertices,vcount, item_size, mat) {
        for (i = 0; i < vcount; i += item_size) {
          math.vec3.transform_mat4x(p_min, vertices[i], vertices[i + 1], vertices[i + 2], mat);
          vertices[i] = p_min[0];
          vertices[i + 1] = p_min[1];
          vertices[i + 2] = p_min[2];


        }
      };

      geometry_data.find_origin = function (vertices,  item_size, draw_offset, draw_count) {

        math.vec3.set(p_min, Infinity, Infinity, Infinity);
        math.vec3.set(p_max, -Infinity, -Infinity, -Infinity);
        for (i = draw_offset * item_size; i < (draw_offset * item_size) + (draw_count * item_size); i += item_size) {
          p_min[0] = Math.min(p_min[0], vertices[i]);
          p_min[1] = Math.min(p_min[1], vertices[i + 1]);
          p_min[2] = Math.min(p_min[2], vertices[i + 2]);

          p_max[0] = Math.max(p_max[0], vertices[i]);
          p_max[1] = Math.max(p_max[1], vertices[i + 1]);
          p_max[2] = Math.max(p_max[2], vertices[i + 2]);
        }
        var origin = [];
        origin[0] = p_min[0] + ((p_max[0] - p_min[0]) * 0.5);
        origin[1] = p_min[1] + ((p_max[1] - p_min[1]) * 0.5);
        origin[2] = p_min[2] + ((p_max[2] - p_min[2]) * 0.5);

        return origin;

      };

      return function (g, vertices, vcount, item_size) {
        g.bounds_sphere = 0;

        math.vec3.set(p_min, Infinity, Infinity, Infinity);
        math.vec3.set(p_max, -Infinity, -Infinity, -Infinity);
        for (i = 0; i < vcount; i += item_size) {
          g.bounds_sphere = Math.max(g.bounds_sphere, Math.abs(Math.hypot(vertices[i], vertices[i + 1], vertices[i + 2])));
          p_min[0] = Math.min(p_min[0], vertices[i]);
          p_min[1] = Math.min(p_min[1], vertices[i + 1]);
          p_min[2] = Math.min(p_min[2], vertices[i + 2]);

          p_max[0] = Math.max(p_max[0], vertices[i]);
          p_max[1] = Math.max(p_max[1], vertices[i + 1]);
          p_max[2] = Math.max(p_max[2], vertices[i + 2]);
        }
        g.origin[0] = p_min[0] + ((p_max[0] - p_min[0]) * 0.5);
        g.origin[1] = p_min[1] + ((p_max[1] - p_min[1]) * 0.5);
        g.origin[2] = p_min[2] + ((p_max[2] - p_min[2]) * 0.5);


        math.aabb.set(g.aabb, p_min[0], p_min[1], p_min[2], p_max[0], p_max[1], p_max[2]);


        return g.bounds_sphere;

      }
    })();

    geometry_data.calc_normals = (function () {
      var v1 = math.vec3(), v2 = math.vec3(), v3 = math.vec3();
      var v1v2 = math.vec3(), v1v3 = math.vec3(), normal = math.vec3();
      var v2v3Alias = math.vec3(), v2v3Alias = math.vec3();
      var i1, i2, i3;
      var normals;
      geometry_data.invert_normals = function (geo) {
        normals = geo.attributes.a_normal_rw.data;
        for (i1 = 0; i1 < normals.length; i1 += 3) {
          normals[i1] = -normals[i1];
          normals[i1 + 1] = -normals[i1 + 1];
          normals[i1 + 2] = -normals[i1 + 2];
        }
        geo.attributes.needs_update = true;
      };

      return function (geo, flateFaces) {

        var vertices = geo.attributes.a_position_rw.data;

        if (!geo.attributes.a_normal_rw) {
          geo.add_attribute('a_normal_rw', {
            data: new Float32Array(vertices.length)
          });
        }

        normals = geo.attributes.a_normal_rw.data;
        var indices = geo.index_data;

        normals.fill(0);



        var weight1, weight2;
        var total = vertices.length;
        var step = 9;
        if (indices !== null) {
          total = indices.length;
          step = 3;
        }
        for (var j = 0; j < total; j += step) {
          if (indices !== null) {
            i1 = indices[j];
            i2 = indices[j + 1];
            i3 = indices[j + 2];
            math.vec3.set(v1, vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
            math.vec3.set(v2, vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
            math.vec3.set(v3, vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]);
          }
          else {
            math.vec3.set(v1, vertices[j + 0], vertices[j + 1], vertices[j + 2]);
            math.vec3.set(v2, vertices[j + 3], vertices[j + 4], vertices[j + 5]);
            math.vec3.set(v3, vertices[j + 6], vertices[j + 7], vertices[j + 8]);
          }




          math.vec3.subtract(v1v2, v3, v2);
          math.vec3.subtract(v1v3, v1, v2);





          if (indices !== null) {
            i1 = i1 * 3;
            i2 = i2 * 3;
            i3 = i3 * 3;
          }
          else {
            i1 = j;
            i2 = j + 3;
            i3 = j + 6;
          }

          if (flateFaces) {
            math.vec3.cross(normal, v1v2, v1v3);
            math.vec3.normalize(v1v2, normal);
            normals[i1 + 0] += v1v2[0];
            normals[i1 + 1] += v1v2[1];
            normals[i1 + 2] += v1v2[2];

            normals[i2 + 0] += v1v2[0];
            normals[i2 + 1] += v1v2[1];
            normals[i2 + 2] += v1v2[2];

            normals[i3 + 0] += v1v2[0];
            normals[i3 + 1] += v1v2[1];
            normals[i3 + 2] += v1v2[2];
          }
          else {

            //math.vec3.normalize(v1v2, v1v2);
            //math.vec3.normalize(v1v3, v1v3);
            math.vec3.cross(normal, v1v2, v1v3);
            //math.vec3.normalize(normal, normal);
            math.vec3.copy(v1v2, normal);


            //math.vec3.subtract(v2v3Alias, v3, v2);
            //math.vec3.normalize(v2v3Alias, v2v3Alias);

            //weight1 = Math.acos(Math.max(-1, Math.min(1, math.vec3.dot(v1v2, v1v3))));
            // weight2 = Math.PI - Math.acos(Math.max(-1, Math.min(1, math.vec3.dot(v1v2, v2v3Alias))));
            // math.vec3.scale(v1v2, normal, weight1);
            normals[i1 + 0] += v1v2[0];
            normals[i1 + 1] += v1v2[1];
            normals[i1 + 2] += v1v2[2];
            // math.vec3.scale(v1v2, normal, weight2);
            normals[i2 + 0] += v1v2[0];
            normals[i2 + 1] += v1v2[1];
            normals[i2 + 2] += v1v2[2];
            //  math.vec3.scale(v1v2, normal, Math.PI - weight1 - weight2);
            normals[i3 + 0] += v1v2[0];
            normals[i3 + 1] += v1v2[1];
            normals[i3 + 2] += v1v2[2];
          }




        }

        if (!flateFaces) {

        }
        for (a = 0; a < normals.length; a += 3) {
          math.vec3.set(v1v2, normals[a], normals[a + 1], normals[a + 2]);
          math.vec3.normalize(normal, v1v2);
          normals[a] = normal[0];
          normals[a + 1] = normal[1];
          normals[a + 2] = normal[2];
        }


      }
    })();

    geometry_data.calc_tangents = (function () {
      var n = math.vec3();
      var t = math.vec3();
      var tangent = math.vec4();
      var tn1 = math.vec3();
      var tn2 = math.vec3();
      var sn = math.vec3();
      var sdir = math.vec3();
      var tdir = math.vec3();
      return function (geo) {

        var vertices = geo.attributes.a_position_rw.data;
        var normals = geo.attributes.a_normal_rw.data;
        var tangents = geo.attributes.a_tangent_rw.data;
        var uvs = geo.attributes.a_uv_rw.data;
        var indices = geo.index_data;

        var tan1 = new Float32Array(vertices.length);
        tan1.fill(0);
        var tan2 = new Float32Array(vertices.length);
        tan2.fill(0);


        var i1, i2, i3;
        var v1, v2, v3;

        var x1, x2, y1, y2, z1, z2, w1, w2, w3, s1, s2, t1, t2, r;

        for (var j = 0; j < indices.length; j = j + 3) {
          i1 = indices[j];
          i2 = indices[j + 1];
          i3 = indices[j + 2];

          v1 = i1 * 3;
          v2 = i2 * 3;
          v3 = i3 * 3;

          x1 = vertices[v2] - vertices[v1];
          x2 = vertices[v3] - vertices[v1];
          y1 = vertices[v2 + 1] - vertices[v1 + 1];
          y2 = vertices[v3 + 1] - vertices[v1 + 1];
          z1 = vertices[v2 + 2] - vertices[v1 + 2];
          z2 = vertices[v3 + 2] - vertices[v1 + 2];

          w1 = i1 * 2; w2 = i2 * 2; w3 = i3 * 2;

          s1 = uvs[w2] - uvs[w1];
          s2 = uvs[w3] - uvs[w1];
          t1 = uvs[w2 + 1] - uvs[w1 + 1];
          t2 = uvs[w3 + 1] - uvs[w1 + 1];


          r = 1.0 / (s1 * t2 - s2 * t1);

          math.vec3.set(sdir,
            (t2 * x1 - t1 * x2) * r,
            (t2 * y1 - t1 * y2) * r,
            (t2 * z1 - t1 * z2) * r);
          math.vec3.set(tdir,
            (s1 * x2 - s2 * x1) * r,
            (s1 * y2 - s2 * y1) * r,
            (s1 * z2 - s2 * z1) * r);


          tan1[v1] += sdir[0]; tan1[v1 + 1] += sdir[1]; tan1[v1 + 2] += sdir[2];

          tan1[v2] += sdir[0]; tan1[v2 + 1] += sdir[1]; tan1[v2 + 2] += sdir[2];

          tan1[v3] += sdir[0]; tan1[v3 + 1] += sdir[1]; tan1[v3 + 2] += sdir[2];

          tan2[v1] += tdir[0]; tan2[v1 + 1] += tdir[1]; tan2[v1 + 2] += tdir[2];
          tan2[v2] += tdir[0]; tan2[v2 + 1] += tdir[1]; tan2[v2 + 2] += tdir[2];
          tan2[v3] += tdir[0]; tan2[v3 + 1] += tdir[1]; tan2[v3 + 2] += tdir[2];

        }


        var vi;
        for (var a = 0; a < vertices.length; a = a + 3) {

          vi = a / 3;
          math.vec3.set(n, normals[a], normals[a + 1], normals[a + 2]);
          math.vec3.set(t, tan1[a], tan1[a + 1], tan1[a + 2]);



          // Gram-Schmidt orthogonalize
          //tangent[a] = (t - n * Dot(n, t)).Normalize();

          math.vec3.scale(sn, n, math.vec3.dot(n, t));

          math.vec3.subtract(tn2, t, sn);

          math.vec3.normalize(tangent, tn2);

          math.vec3.cross(tn1, n, t);
          math.vec3.set(tn2, tan2[a], tan2[a + 1], tan2[a + 2]);

          tangent[3] = math.vec3.dot(tn1, tn2) < 0 ? -1 : 1;

          tangents[vi * 4] = tangent[0];
          tangents[vi * 4 + 1] = tangent[1];
          tangents[vi * 4 + 2] = tangent[2];
          tangents[vi * 4 + 3] = tangent[3];

          //tangent[a] = (t - n * Dot(n, t)).Normalize();
          // Calculate handedness
          //tangent[a].w = (Dot(Cross(n, t), tan2[a]) < 0.0F) ? -1.0F : 1.0F;
        }


      }
    })();


    geometry_data.lines_builder = new function () {

      this.vertices = new ge.array();


      var xx, yy, zz;
      var xs, ys, zs;

      this.clear = function () {
        this.vertices.clear();
        return this;
      };

      this.add = function (x, y, z) {
        xx = x; yy = y; zz = z;
        this.vertices.push(x);
        this.vertices.push(y);
        this.vertices.push(z);
        return (this);
      };
      this.add2 = function (x1, y1, z1, x2, y2, z2) {
        this.add(x1, y1, z1);
        this.add(x2, y2, z2);
        return (this);
      };
      this.add_to = function (x, y, z) {
        this.add(xx, yy, zz);
        this.add(x, y, z);
        return (this);
      };

      this.move_to = function (x, y, z) {
        xx = x; yy = y; zz = z;
        xs = x; ys = y; zs = z;
        return (this);
      };

      this.close_path = function () {
        this.add(xx, yy, zz);
        this.vertices.push(xs);
        this.vertices.push(ys);
        this.vertices.push(zs);

        return (this);
      };

      this.update_geo = function (g) {
        var a = g.attributes.a_position_rw;
        for (xx = 0; xx < a.data.length; xx++) {
          a.data[xx] = this.vertices.data[xx];
        }
        a.needs_update = true;
      };
      this.build = function () {
        var g = new ge.geometry.geometry_data();

        g.add_attribute("a_position_rw", {
          data: new Float32Array(this.vertices.length),
          item_size: 3
        });


        for (xx = 0; xx < this.vertices.length; xx++) {
          g.attributes.a_position_rw.data[xx] = this.vertices.data[xx];
        }



        g.num_items = this.vertices.length / 3;
        geometry_data.calc_bounds(g, g.attributes.a_position_rw.data, g.attributes.a_position_rw.data.length, 3);
        this.clear();
        return (g);
      };

      return (this);
    }

    geometry_data.create = (function () {
      
      return function (def) {


        var vertex_size = def.vertex_size || 3;
        var g = new ge.geometry.geometry_data();

        if (def.vertices) {
          g.add_attribute("a_position_rw", {
            data: def.vertices,
            item_size: vertex_size
          });
          g.num_items = def.vertices.length / vertex_size;
        }

        if (def.normals) {
          g.add_attribute("a_normal_rw", { data: def.normals, item_size: vertex_size});
        }

        if (def.uvs) {
          g.add_attribute("a_uv_rw", { data: def.uvs, item_size: 2 });
        }

        if (def.colors) {
          g.add_attribute("a_color_rw", { data: def.colors, item_size: 4 });
        }

        if (def.skin_joints) {
          g.add_attribute("a_bone_indices", { data: def.skin_joints, item_size: 4 });
        }

        if (def.skin_weights) {
          g.add_attribute("a_bone_weights", { data: def.skin_weights, item_size: 4 });
        }

        if (def.attr) {
          for (var a in def.attr) {
            g.add_attribute(a, def.attr[a]);
          }
        }

        if (def.indices) {
          g.set_indices(def.indices);
        }

        if (g.attributes.a_position_rw) {
          geometry_data.calc_bounds(g, g.attributes.a_position_rw.data, g.attributes.a_position_rw.data.length, 3);
        }
        
        return g;
      }
    })();

    
    geometry_data.merge = (function () {

      return function (geos) {

        var att = {}, t, a, i;
        var index_size = 0;
        for (a in geos[0].attributes) {
          t = geos[0].attributes[a];
          att[a] = {
            __size: 0,
            __datas: [],
            item_size: t.item_size,
            divisor: t.divisor,
          };
        }


        var g = new ge.geometry.geometry_data();
        g.subs = [];
        var v_count = 0, v_index = 0;
        geos.forEach(function (geo) {
          if (geo.index_data) {
            index_size += geo.index_data.length;
          }
          for (a in geo.attributes) {
            if (att[a]) {
              att[a].__size += geo.attributes[a].data.length;
              att[a].__datas.push(geo.attributes[a].data);
            }
            if (a === 'a_position_rw') {
              v_count = geo.attributes[a].data.length / geo.attributes[a].item_size;
              g.subs.push({ v_index: v_index, v_count: v_count });
              v_index += v_count;
            }

          }


        });


        var di = 0, gi = 0;
        for (a in att) {
          t = geos[0].attributes[a];
          att[a].data = new Float32Array(att[a].__size);
          di = 0;
          att[a].__datas.forEach(function (d) {
            for (i = 0; i < d.length; i++) {
              att[a].data[di++] = d[i];
            }
          });
          delete att[a].__size;
          delete att[a].__datas;
          g.add_attribute(a, att[a]);
        }
        if (index_size > 0) {
          g.index_data = geometry_data.create_index_data(index_size);
          di = 0;
          gi = 0;
          geos.forEach(function (geo, ii) {
            for (i = 0; i < geo.index_data.length; i++) {
              g.index_data[di++] = g.subs[ii].v_index + geo.index_data[i];
            }
            g.subs[ii].i_start = gi * 4;
            g.subs[ii].i_count = geo.index_data.length;
            gi += geo.index_data.length;
          });
        }

        g.num_items = g.index_data.length;

       // ge.geometry.geometry_data.calc_normals(g);
        return g;



      }

    })();

    geometry_data.create_float32_ids = function (nums) {

      var arr = new Float32Array(nums);

      for (var i = 0; i < nums; i++)
        arr[i] = i;

      return arr;
    }

    geometry_data.create_float32_timeline = function (nums) {

      var arr = new Float32Array(nums);

      for (var i = 0; i < nums; i++)
        arr[i] = i/nums;

      return arr;
    }


    geometry_data.to_distributed_geometry = (function () {
      var _vertices = new ge.array();

      var f_vertices = new ge.array();
      var f_normals = new ge.array();
      var f_uvs = new ge.array();
      var _g = {
        aabb: [],
        origin: []
      }

      var i = 0, ii = 0;


     

      function process_distribution(g) {
        _vertices
          .push(g.attributes.a_position_rw.data[i])
          .push(g.attributes.a_position_rw.data[i + 1])
          .push(g.attributes.a_position_rw.data[i + 2]);
        if (g.attributes.a_normal_rw) {
          f_normals
            .push(g.attributes.a_normal_rw.data[i])
            .push(g.attributes.a_normal_rw.data[i + 1])
            .push(g.attributes.a_normal_rw.data[i + 2]);

        }
        if (g.attributes.a_uv_rw) {
          ii = (i / 3) * 2;
          f_uvs
            .push(g.attributes.a_uv_rw.data[ii])
            .push(g.attributes.a_uv_rw.data[ii + 1]);
        }
      }
      return function (g,divs) {

        f_vertices.clear();
        f_normals.clear();
        f_uvs.clear();
        var distribution = [];
        var dist;
        divs.forEach(function (div) {
          _vertices.clear();


          if (div.length) {
            
            div.forEach(function (div) {
              for (i = div.draw_offset * 3; i < (div.draw_offset * 3) + (div.draw_count * 3); i += 3) {
                process_distribution(g);
              }
            });
          }
          else {
            for (i = div.draw_offset * 3; i < (div.draw_offset * 3) + (div.draw_count * 3); i += 3) {
              process_distribution(g);
            }
          }
          

          geometry_data.calc_bounds(_g, _vertices.data, _vertices.length, 3);
          if (div.length) {
            dist = div[0];
          }
          else {
            dist = div;
          }
        
          Object.assign(dist, {
            draw_offset: f_vertices.length / 3,
            draw_count: _vertices.length / 3,
            origin: [_g.origin[0], _g.origin[1], _g.origin[2]]
          })
          distribution.push(dist);
          if (dist.center_pivot!==false) {
            geometry_data.center_pivot(_g, 1, 1, 1, 0, 0, 0, _vertices.data, _vertices.length, 3);

          }
         
          f_vertices.append_other(_vertices);









        });



        var g2 = geometry_data.create({
          vertices: f_vertices.float32Array(),
          normals: f_normals.length > 0 ? f_normals.float32Array() : undefined,
          uvs: f_uvs.length > 0 ? f_uvs.float32Array() : undefined
        })

        g2.distribution = distribution;
        return g2;
      }

    })();

    return geometry_data;

  });



 
  ge.geometry.shapes.cube = function (options) {
    options = options || {};


    options.size = options.size || 1;
    var width = options.width || options.size;
    var height = options.height || options.size;
    var depth = options.depth;

    if (depth === undefined) depth = options.size;
    var divs = options.divs || 1;

    var divs_x = Math.floor(options.divs_x) || divs;
    var divs_y = Math.floor(options.divs_y) || divs;
    var divs_z = Math.floor(options.divs_z) || divs;

    var vector = math.vec3();
    var segmentWidth, segmentHeight, widthHalf, heightHalf, depthHalf;
    var gridX1, gridY1, vertexCounter, ix, iy, x, y;
    var indices = [];
    var vertices = [];
    var normals = [];
    var uvs = [];
    var numberOfVertices = 0;
    function buildPlane(u, v, w, udir, vdir, width, height, depth, gridX, gridY) {

      segmentWidth = width / gridX;
      segmentHeight = height / gridY;

      widthHalf = width / 2;
      heightHalf = height / 2;
      depthHalf = depth / 2;

      gridX1 = gridX + 1;
      gridY1 = gridY + 1;

      vertexCounter = 0;

      // generate vertices, normals and uvs

      for (iy = 0; iy < gridY1; iy++) {

        y = iy * segmentHeight - heightHalf;

        for (ix = 0; ix < gridX1; ix++) {

          x = ix * segmentWidth - widthHalf;

          vector[u] = x * udir;
          vector[v] = y * vdir;
          vector[w] = depthHalf;

          vertices.push(vector[0], vector[1], vector[2]);

          vector[u] = 0;
          vector[v] = 0;
          vector[w] = depth > 0 ? 1 : - 1;

          normals.push(vector[0], vector[1], vector[2]);

          // uvs

          uvs.push(ix / gridX);
          uvs.push((iy / gridY));

          // counters

          vertexCounter += 1;

        }

      }

      // indices

      // 1. you need three indices to draw a single face
      // 2. a single segment consists of two faces
      // 3. so we need to generate six (2*3) indices per segment

      for (iy = 0; iy < gridY; iy++) {

        for (ix = 0; ix < gridX; ix++) {

          var a = numberOfVertices + ix + gridX1 * iy;
          var b = numberOfVertices + ix + gridX1 * (iy + 1);
          var c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
          var d = numberOfVertices + (ix + 1) + gridX1 * iy;

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);


        }

      }

      numberOfVertices += vertexCounter;

    }


    buildPlane(2, 1, 0, - 1, - 1, depth, height, width, divs_z, divs_y, 0); // px
    buildPlane(2, 1, 0, 1, - 1, depth, height, - width, divs_z, divs_y, 1); // nx
    buildPlane(0, 2, 1, 1, 1, width, depth, height, divs_x, divs_z, 2); // py
    buildPlane(0, 2, 1, 1, - 1, width, depth, - height, divs_x, divs_z, 3); // ny
    buildPlane(0, 1, 2, 1, - 1, width, height, depth, divs_x, divs_y, 4); // pz
    buildPlane(0, 1, 2, - 1, - 1, width, height, - depth, divs_x, divs_y, 5); // nz




    var g = new ge.geometry.geometry_data();

    g.add_attribute("a_position_rw", { data: new Float32Array(vertices) });
    g.add_attribute("a_normal_rw", { data: new Float32Array(normals) });
    g.add_attribute("a_uv_rw", { data: new Float32Array(uvs), item_size: 2 });
    g.add_attribute("a_tangent_rw", { data: new Float32Array(((vertices.length / 3) * 4)), item_size: 4 });
    g.set_indices(indices);
    g.shape_type = "cube";


    ge.geometry.geometry_data.calc_tangents(g);
    ge.geometry.geometry_data.calc_bounds(g, g.attributes.a_position_rw.data, g.attributes.a_position_rw.data.length, 3);

    return (g);
  };

  ge.geometry.shapes.plane = function (options) {
    options = options || {};
    options.size = options.size || 1;

    width = options.width || options.size;
    height = options.height || options.size;
    options.divs = options.divs || 1;
    options.divsX = options.divsX || options.divs;
    options.divsY = options.divsY || options.divs;
    divs_x = options.divsX;
    divs_y = options.divsY;

    var width_half = width / 2;
    var height_half = height / 2;

    var gridX = Math.floor(divs_x);
    var gridY = Math.floor(divs_y);

    var gridX1 = gridX + 1;
    var gridY1 = gridY + 1;

    var segment_width = width / gridX;
    var segment_height = height / gridY;

    var ix, iy;
    var vCount = (divs_x + 1) * (divs_y + 1);
    var g = new ge.geometry.geometry_data();



    g.add_attribute("a_position_rw", { data: new Float32Array(vCount * 3), item_size: 3 });
    var normals = null, uvs = null;
    g.add_attribute("a_normal_rw", { data: new Float32Array(vCount * 3), item_size: 3 });
    normals = g.attributes.a_normal_rw.data;
    g.add_attribute("a_uv_rw", { data: new Float32Array(vCount * 2), item_size: 2 });
    uvs = g.attributes.a_uv_rw.data;
    g.add_attribute("a_tangent_rw", { data: new Float32Array(vCount * 4), item_size: 4 });




    g.index_data = ge.geometry.geometry_data.create_index_data((gridX * gridY) * 6);
    g.index_needs_update = true;
    g.num_items = g.index_data.length;
    g.shape_type = "plane";

    var positions = g.attributes.a_position_rw.data;


    var indices = g.index_data;
    var ii = 0, vi = 0;


    for (iy = 0; iy < gridY1; iy++) {
      var y = iy * segment_height - height_half;
      for (ix = 0; ix < gridX1; ix++) {
        var x = ix * segment_width - width_half;

        positions[(vi * 3) + 0] = x;
        positions[(vi * 3) + 1] = -y;
        positions[(vi * 3) + 2] = 0;

        if (normals !== null) {

          normals[(vi * 3) + 0] = 0;
          normals[(vi * 3) + 1] = 0;
          normals[(vi * 3) + 2] = 1;
        }

        if (uvs !== null) {
          uvs[(vi * 2) + 0] = ix / gridX;
          uvs[(vi * 2) + 1] = 1 - (iy / gridY);
        }


        vi++;
      }

    }
    ii = 0;
    var a, b, c, d;

    for (iy = 0; iy < gridY; iy++) {
      for (ix = 0; ix < gridX; ix++) {
        a = ix + gridX1 * iy;
        b = ix + gridX1 * (iy + 1);
        c = (ix + 1) + gridX1 * (iy + 1);
        d = (ix + 1) + gridX1 * iy;
        // faces
        indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
        indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
      }

    }

    ge.geometry.geometry_data.calc_tangents(g);

    ge.geometry.geometry_data.calc_bounds(g, g.attributes.a_position_rw.data, g.attributes.a_position_rw.data.length, 3);



    return (g);
  };

  ge.geometry.shapes.sphere = (function () {
    var norm = math.vec3();
    var vert = math.vec3();
    return function (options) {
      options = options || {};
      options.rad = options.rad || 1;
      options.divs = options.divs || 8;
      options.divsX = options.divsX || options.divs;
      options.divsY = options.divsY || options.divs;


      var radX = options.radX || options.rad;
      var radY = options.radY || options.rad;
      var radZ = options.radZ || options.rad;

      var widthSegments = Math.max(3, Math.floor(options.divsX));
      var heightSegments = Math.max(2, Math.floor(options.divsY));

      var phiStart = options.phiStart !== undefined ? options.phiStart : 0;
      var phiLength = options.phiLength !== undefined ? options.phiLength : Math.PI * 2;

      var thetaStart = options.thetaStart !== undefined ? options.thetaStart : 0;
      var thetaLength = options.thetaLength !== undefined ? options.thetaLength : Math.PI;

      var thetaEnd = thetaStart + thetaLength;

      var ix, iy;

      var index = 0;
      var grid = [];


      var vCount = (widthSegments + 1) * (heightSegments + 1);
      var g = new ge.geometry.geometry_data();


      g.add_attribute("a_position_rw", { data: new Float32Array(vCount * 3), item_size: 3 });
      var normals = null, uvs = null;
      g.add_attribute("a_normal_rw", { data: new Float32Array(vCount * 3), item_size: 3 });
      normals = g.attributes.a_normal_rw.data;

      g.add_attribute("a_uv_rw", { data: new Float32Array(vCount * 2), item_size: 2 });
      uvs = g.attributes.a_uv_rw.data;


      g.add_attribute("a_tangent_rw", { data: new Float32Array(vCount * 4), item_size: 4 });




      g.index_data = ge.geometry.geometry_data.create_index_data(vCount * 6);
      g.num_items = g.index_data.length;
      g.index_needs_update = true;

      g.shape_type = "sphere";
      var positions = g.attributes.a_position_rw.data;


      var indices = g.index_data;
      var ii = 0, vi = 0;



      for (iy = 0; iy <= heightSegments; iy++) {

        var verticesRow = [];

        var v = iy / heightSegments;
        //
        // special case for the poles

        var uOffset = (iy == 0) ? 0.5 / widthSegments : ((iy == heightSegments) ? - 0.5 / widthSegments : 0);

        for (ix = 0; ix <= widthSegments; ix++) {

          var u = ix / widthSegments;

          vert[0] = - radX * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
          vert[1] = radY * Math.cos(thetaStart + v * thetaLength);
          vert[2] = radZ * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);


          positions[(vi * 3) + 0] = vert[0];
          positions[(vi * 3) + 1] = vert[1];
          positions[(vi * 3) + 2] = vert[2];

          if (normals !== null) {
            math.vec3.normalize(norm, vert);
            normals[(vi * 3) + 0] = norm[0];
            normals[(vi * 3) + 1] = norm[1];
            normals[(vi * 3) + 2] = norm[2];
          }

          if (uvs !== null) {
            uvs[(vi * 2) + 0] = u + uOffset;
            uvs[(vi * 2) + 1] = 1 - v;
          }



          vi++;

          verticesRow.push(index++);

        }

        grid.push(verticesRow);

      }
      ii = 0;
      for (iy = 0; iy < heightSegments; iy++) {
        for (ix = 0; ix < widthSegments; ix++) {
          var a = grid[iy][ix + 1];
          var b = grid[iy][ix];
          var c = grid[iy + 1][ix];
          var d = grid[iy + 1][ix + 1];

          if (iy !== 0 || thetaStart > 0) {
            indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
          }
          if (iy !== heightSegments - 1 || thetaEnd < Math.PI) {
            indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
          }

        }

      }
      ge.geometry.geometry_data.calc_tangents(g);
      ge.geometry.geometry_data.calc_bounds(g, g.attributes.a_position_rw.data, g.attributes.a_position_rw.data.length, 3);
      return (g);

    }
  })();


  ge.geometry.shapes.terrain = (function () {
    var vkey, vindex_width = 1200;

    var vmap = new Uint8Array(0), vdata = new Float32Array(0);

    var patches = {};


    var vindex_width2 = vindex_width / 2;
    var check_vlevel_value = 0, vkey;
    function check_vlevel(x, z) {
      check_vlevel_value = vmap[(z + vindex_width2) * vindex_width + (x + vindex_width2)];
      return check_vlevel_value;
    };

    var region_size = 1024;
    var s = 1;
    while (s <= region_size) {
      patches[s] = { i: 0, list: [] };
      s = s * 2;
    }

    vindex_width = (region_size * 2) + 8;
    vindex_width2 = vindex_width / 2;

    vkey = vindex_width * vindex_width;
    if (vmap.length < vkey) {
      vmap = new Uint8Array(vkey)
      vdata = new Float32Array(vkey * 4);
    }

    function set_vlevel(x, z, l) {
      vkey = (z + vindex_width2) * vindex_width + (x + vindex_width2);
      vmap[vkey] = Math.min(vmap[vkey], l);
    }

    var output = new Float32Array(100000 * 6), oi = 0, qii = 0;
    var GQT = new Float32Array(100000 * 2);

    var hh0, hh1, hh2, hh3, hh4;
    var hdata, data_size, data_size2;
    var MIN_PATCH_SIZE = 4;
    var PATCH_SIZE = 16;
    var MIN_FAN_DETAIL = 2;
    function H(xp, zp) {
      return hdata[zp * (data_size) + xp];
    }

    var draw_triangle = function (x0$, z0$, x1$, z1$, x2$, z2$, s$) {
      set_vlevel(x0$, z0$, s$)
      output[oi] = x0$;
      output[oi + 2] = z0$;
      oi += 6;

      set_vlevel(x1$, z1$, s$)
      output[oi] = x1$;
      output[oi + 2] = z1$;
      oi += 6;

      set_vlevel(x2$, z2$, s$)
      output[oi] = x2$;
      output[oi + 2] = z2$;
      oi += 6;


    };


    var draw_fan = (function () {

      var fi = 0, lfx, lfz, fx, fz;

      var fan = [
        -1, 1, -0.75, 1, -0.5, 1, -0.25, 1, 0, 1, 0.25, 1, 0.5, 1, 0.75, 1, 1, 1,
        1, 0.75, 1, 0.5, 1, 0.25, 1, 0, 1, -0.25, 1, -0.5, 1, -0.75, 1, -1,
        0.75, -1, 0.5, -1, 0.25, -1, 0, -1, -0.25, -1, -0.5, -1, -0.75, -1, -1, -1,
        -1, -0.75, -1, -0.5, -1, -0.25, -1, 0, -1, 0.25, -1, 0.5, -1, 0.75, -1, 1
      ];

      var skip_edge_check = [];
      skip_edge_check[16] = true; skip_edge_check[32] = true; skip_edge_check[48] = true; skip_edge_check[64] = true;

      var fan_len = fan.length;
      return function (x, z, s, fd) {
        lfx = fan[0];
        lfz = fan[1];
        fi = fd;
        while (fi < fan_len) {
          fx = fan[fi]; fz = fan[fi + 1];

          check_vlevel_value = vmap[((z + fz * s) + vindex_width2) * vindex_width + ((x + fx * s) + vindex_width2)];
          if (skip_edge_check[fi] || check_vlevel_value < s) {
            draw_triangle(x, z, x + lfx * s, z + lfz * s, x + fx * s, z + fz * s, s)
            lfx = fx; lfz = fz;
          }
          fi += fd;
        }
      }
    })();


    function eval_area_height(x, z, s, pndx, slot) {

      hh0 = H(x, z);
      hh1 = H(x - s, z - s);
      hh2 = H(x + s, z - s);
      hh3 = H(x + s, z + s);
      hh4 = H(x - s, z + s);


      var indx = qii;

      output[indx] = Math.max(
        Math.abs(((hh1 + hh2) * 0.5) - hh0), Math.abs(((hh4 + hh3) * 0.5) - hh0), Math.abs(((hh1 + hh4) * 0.5) - hh0), Math.abs(((hh2 + hh3) * 0.5) - hh0)
      );

      if (pndx > -1) {
        output[pndx + slot] = indx;
      }

      if (s > MIN_PATCH_SIZE) {
        qii += 5;
        s *= 0.5;
        output[indx] = Math.max(
          output[indx],
          eval_area_height(x - s, z - s, s, indx, 1),
          eval_area_height(x + s, z - s, s, indx, 2),
          eval_area_height(x - s, z + s, s, indx, 3),
          eval_area_height(x + s, z + s, s, indx, 4));
      }

      return output[indx];
    }

    var _RSK = new Float32Array(1024), _si = 0, i = 0;
    var dd = 0, dlen = 0;
    function rasterize_patch(x, z, s, detail, rg_QT) {
      _si = 0;
      var i = 0;
      _RSK[_si] = x; _RSK[_si + 1] = z; _RSK[_si + 2] = s; _RSK[_si + 3] = i; _si += 4;

      while (_si > 0) {
        _si -= 4;
        x = _RSK[_si]; z = _RSK[_si + 1]; s = _RSK[_si + 2]; i = _RSK[_si + 3];
        dd = detail;

        if (s > PATCH_SIZE || (s > MIN_PATCH_SIZE && rg_QT[i] > dd)) {
          s *= 0.5;
          _RSK[_si] = x + s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 4]; _si += 4;
          _RSK[_si] = x - s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 3]; _si += 4;
          _RSK[_si] = x + s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 2]; _si += 4;
          _RSK[_si] = x - s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 1]; _si += 4;
        }
        else {
          p = patches[s];
          p.list[p.i++] = x;
          p.list[p.i++] = z;
        }
      }
    }

    var patch_index = 0;
    var check_for_edge_cases = true;
    var check_edge_cases = false;
    function render_patches() {
      s = MIN_PATCH_SIZE;
      check_edge_cases = false;
      patch_index = 0;
      while (s <= PATCH_SIZE) {
        p = patches[s];

        i = 0;
        j = p.i;
        while (i < j) {

          x = p.list[i++];
          z = p.list[i++];
          fd = 16;

          if (check_for_edge_cases) {
            if (s >= MIN_PATCH_SIZE) {
              check_edge_cases = false;

              if (check_vlevel(x - s, z) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x + s, z) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x, z - s) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x, z + s) < s) {
                check_edge_cases = true;
              }


              if (check_edge_cases) {

                fd = (s / check_vlevel_value);
                if (fd < 16) {
                  fd = Math.max(2, 8 / fd);
                }
                else fd = 2;

                fd = Math.min(MIN_FAN_DETAIL, fd);

              }

            }

          }
          draw_fan(x, z, s, fd);
          patch_index++;
        }
        s = s * 2;
      }

    }


    function calculate_output_data(is, ie, xo, zo, sc) {
      i = is;
      s = PATCH_SIZE;
      while (i < ie) {
        x = output[i]
        z = output[i + 2];
        _xx = (x * sc) + xo;
        _zz = (z * sc) + zo;
        vkey = (_zz + vindex_width2) * vindex_width + (_xx + vindex_width2);
        if (vmap[vkey] !== 222) {
          vmap[vkey] = 222;
          vkey *= 4;
          vdata[vkey] = H(x, z);

          nx = (H(x - s, z) - H(x + s, z));
          ny = (s * 2);
          nz = (H(x, z - s) - H(x, z + s));

          _fp = nx * nx + ny * ny + nz * nz;
          if (_fp > 0) _fp = 1 / Math.sqrt(_fp);
          nx *= _fp;
          ny *= _fp;
          nz *= _fp;

          vdata[vkey + 1] = nx;
          vdata[vkey + 2] = ny;
          vdata[vkey + 3] = nz;
        }
        else {
          vkey *= 4;
        }

        output[i + 1] = vdata[vkey];
        output[i + 3] = vdata[vkey + 1];
        output[i + 4] = vdata[vkey + 2];
        output[i + 5] = vdata[vkey + 3];


        output[i] = _xx;
        output[i + 2] = _zz;



        i += 6;
      }




    }


    function process(g, data,dsize,details) {

      hdata = data;
      data_size = dsize;
      data_size2 = data_size / 2;

      qii = 0;
      eval_area_height(data_size2, data_size2, data_size2, -1, 0);


      i = 0;

      while (i < qii) { GQT[i] = output[i++]; }
      oi = 0;
      vmap.fill(255);


      rasterize_patch(data_size2, data_size2, data_size2, details, GQT);
      render_patches();

      calculate_output_data(0, oi, 0, 0, 1);
      var position = g.attributes.a_position_rw;
      position.data = new Float32Array((oi / 6) * 8);

      var ii = 0;
      for (i = 0; i < oi; i += 6) {
        position.data[ii] = output[i];
        position.data[ii + 1] = output[i + 1];
        position.data[ii + 2] = output[i + 2];
        position.data[ii + 3] = output[i + 3];
        position.data[ii + 4] = output[i + 4];
        position.data[ii + 5] = output[i + 5];

        position.data[ii + 6] = position.data[ii] / data_size;
        position.data[ii + 7] = position.data[ii + 2] / data_size;

        ii += 8;
      }
      g.num_items = ii / 8;
      position.data_length = ii;
      position.needs_update = true;
      ge.geometry.geometry_data.calc_bounds(g, position.data, position.data.length, 8);
    }

    return function (def) {

      var g = new ge.geometry.geometry_data();


       g.add_attribute("a_position_rw", {
        item_size: 3, data: new Float32Array(0), stride: 8 * 4
      });

      g.add_attribute("a_normal_rw", {
        item_size: 3, stride: 8 * 4, offset: 3 * 4,
      });

      g.add_attribute("a_uv_rw", {
        item_size: 2, stride: 8 * 4, offset: 6 * 4,
      });


      
      if (def.url) {
        var divisor = def.divisor || 1;
        ge.load_working_image_data(def.url, function (image_data, width, height) {
          var data = new Float32Array((def.size + 1) * (def.size + 1));
          for (var i = 0; i < image_data.length / 4; i++) {
            data[i] = image_data[i * 4] / divisor;
          }
          process(g, data, def.size, def.details || 4);

        }, def.size, def.size);
      }
      

      return (g);

    }
  })();


  (function () {
    var face_type = ge.define(function (proto) {

      proto.clear = function () {
        this.indices.clear();
        this.normal.clear();
        this.texture.clear();

      }
      return function () {
        this.indices = new ge.array();
        this.texture = new ge.array();
        this.normal = new ge.array();
        this.vindex = 0;
        this.obj_name = undefined;
      }


    });

    var faces = [];

    var faces_pool = new fin.object_pooler(function () {

      return new face_type();

    });

    var vertices = new ge.array(), vert_size = 3;
    var uvs = new ge.array(), uv_size = 2;
    var normals = new ge.array();

    var obj_vertices = new ge.array();
    var obj_uvs = new ge.array();
    var obj_normals = new ge.array();


    ge.geometry.shapes.obj = (function () {



      var face, i, m, splitedLine, commentStart, dIndex, splitedFaceIndices;


      var obj_name;

      var facesMaterialsIndex = new ge.array();

      function parse_mtl_line(obj, line, mtl) {
        /*Not include comment*/
        commentStart = line.indexOf("#");
        if (commentStart != -1) {
          line = line.substring(0, commentStart);
        }

        line = line.trim();
        splitedLine = line.split(/\s+/);

        if (splitedLine[0] === "newmtl") {

          if (mtl.name) {

            obj.materials.push(mtl);
            mtl = {};
          }
          mtl.name = splitedLine[1];
        }
        else if (splitedLine[0] === "Kd") {
          mtl.diffuse = [];
          for (i = 0; i < 3; ++i) {
            mtl.diffuse.push(parseFloat(splitedLine[i + 1]));
          }
        }
        else if (splitedLine[0] === "Ka") {
          mtl.ambient = [];
          for (i = 0; i < 3; ++i) {
            mtl.ambient.push(parseFloat(splitedLine[i + 1]));
          }
        }
        else if (splitedLine[0] === "Ks") {
          mtl.specular = [];
          for (i = 0; i < 3; ++i) {
            mtl.specular.push(parseFloat(splitedLine[i + 1]));
          }
        }
        else if (splitedLine[0] === "Ns") {
          mtl.specularExponent = parseFloat(splitedLine[1]);
        }
        else if (splitedLine[0] === "d" || splitedLine[0] === "Tr") {
          mtl.transparent = parseFloat(splitedLine[1]);
        }
        else if (splitedLine[0] === "illum") {
          mtl.illumMode = parseFloat(splitedLine[1]);
        }
        else if (splitedLine[0] === "map_Ka") {
          mtl.ambientMap = line.replace(splitedLine[0], "").trim();
        }
        else if (splitedLine[0] === "map_Kd") {
          mtl.diffuseMap = line.replace(splitedLine[0], "").trim();
        }
        else if (splitedLine[0] === "map_Ks") {
          mtl.specularMap = line.replace(splitedLine[0], "").trim();
        }
        else if (splitedLine[0] === "map_d") {
          mtl.alphaMat = line.replace(splitedLine[0], "").trim();
        }
        else if (splitedLine[0] === "map_bump" || splitedLine[0] === "bump") {
          mtl.bumpMap = line.replace(splitedLine[0], "").trim();
        }
        else if (splitedLine[0] === "disp") {
          mtl.displacementMap = line.replace(splitedLine[0], "").trim();
        }

        return mtl;
      }

      function parse_obj_line(obj, line) {
        /*Not include comment*/
        commentStart = line.indexOf("#");
        if (commentStart != -1) {
          line = line.substring(0, commentStart);
        }
        line = line.trim();

        splitedLine = line.split(/\s+/);

        if (splitedLine[0] === 'v') {
          vert_size = splitedLine[4] ? 4 : 3;

          if (vert_size == 3) {
            vertices
              .push(parseFloat(splitedLine[1]))
              .push(parseFloat(splitedLine[2]))
              .push(parseFloat(splitedLine[3]));


          }
          else if (vert_size == 4) {
            vertices
              .push(parseFloat(splitedLine[1]))
              .push(parseFloat(splitedLine[2]))
              .push(parseFloat(splitedLine[3]))
              .push(parseFloat(splitedLine[4]));



          }

        }
        else if (splitedLine[0] === 'vt') {

          uv_size = splitedLine[3] ? 3 : 2;
          if (uv_size == 2) {
            uvs
              .push(parseFloat(splitedLine[1]))
              .push(parseFloat(splitedLine[2]));
          }
          else if (uv_size == 3) {

            uvs
              .push(parseFloat(splitedLine[1]))
              .push(parseFloat(splitedLine[2]))
              .push(parseFloat(splitedLine[3]));

          }

        }
        else if (splitedLine[0] === 'vn') {
          normals
            .push(parseFloat(splitedLine[1]))
            .push(parseFloat(splitedLine[2]))
            .push(parseFloat(splitedLine[3]));


        }
        else if (splitedLine[0] === 'f') {
          face = faces_pool.get();
          face.clear();
          faces[faces.length] = face;
          face.obj_name = obj_name;
          for (i = 1; i < splitedLine.length; ++i) {
            dIndex = splitedLine[i].indexOf('//');
            splitedFaceIndices = splitedLine[i].split(/\W+/);

            if (dIndex > 0) {
              /*Vertex Normal Indices Without Texture Coordinate Indices*/
              face.indices.push(parseInt(splitedFaceIndices[0]));
              face.normal.push(parseInt(splitedFaceIndices[1]));
            }
            else {
              if (splitedFaceIndices.length === 1) {
                /*Vertex Indices*/
                face.indices.push(parseInt(splitedFaceIndices[0]));
              }
              else if (splitedFaceIndices.length === 2) {
                /*Vertex Texture Coordinate Indices*/
                face.indices.push(parseInt(splitedFaceIndices[0]));
                face.texture.push(parseInt(splitedFaceIndices[1]));
              }
              else if (splitedFaceIndices.length === 3) {
                /*Vertex Normal Indices*/
                face.indices.push(parseInt(splitedFaceIndices[0]));
                face.texture.push(parseInt(splitedFaceIndices[1]));
                face.normal.push(parseInt(splitedFaceIndices[2]));
              }
            }
          }


        }
        else if (splitedLine[0] === "g" || splitedLine[0] === "o") {
          obj_name = splitedLine[1].trim();
        }
        else if (splitedLine[0] === "usemtl") {
          if (faces.length === 0) {
            facesMaterialsIndex.data[0] = splitedLine[1].trim();
          }
          else {
            var materialName = splitedLine[1].trim();
            var materialStartIndex = faces.length;
            facesMaterialsIndex.push(materialName).push(materialStartIndex);

            //obj.facesMaterialsIndex.push({ materialName: materialName, materialStartIndex: materialStartIndex });
          }
        }
      }

      function add_vertex(obj, i) {
        i = (i - 1) * vert_size;
        obj_vertices
          .push(vertices.data[i])
          .push(vertices.data[i + 1])
          .push(vertices.data[i + 2]);
      }

      function add_normal(obj, i) {
        i = (i - 1) * vert_size;
        obj_normals
          .push(normals.data[i])
          .push(normals.data[i + 1])
          .push(normals.data[i + 2]);
      }

      function add_uv(obj, i) {
        i = (i - 1) * uv_size;
        obj_uvs.push(uvs.data[i]).push(uvs.data[i + 1]);
      }

      return {
        extract_mesh: function (geo, index) {

          m = geo.obj_meta.meshes[index];

          obj_vertices.clear();
          obj_normals.clear();

          for (i = m.draw_offset * 3; i < (m.draw_offset * 3) + (m.draw_count * 3); i += 3) {
            obj_vertices
              .push(geo.attributes.a_position_rw.data[i])
              .push(geo.attributes.a_position_rw.data[i + 1])
              .push(geo.attributes.a_position_rw.data[i + 2]);

            obj_normals
              .push(geo.attributes.a_normal_rw.data[i])
              .push(geo.attributes.a_normal_rw.data[i + 1])
              .push(geo.attributes.a_normal_rw.data[i + 2]);
          }
          var g = ge.geometry.geometry_data.create({
            vertices: obj_vertices.float32Array(),
            normals: obj_normals.float32Array()
          });
          var o = [g.origin[0], g.origin[1], g.origin[2]];
          g.center_pivot(1, 1, 1, 0, 0, 0);
          g.origin = o;
          return g;
        },
        parse: function (obj_string, mtl_string) {

          obj_name = undefined;
          var obj = {
            materials: [],
            meshes: []
          };

          facesMaterialsIndex.push('').push(0);

          if (mtl_string) {
            var mtl = {};
            mtl_string.split('\n').forEach(function (line) {
              mtl = parse_mtl_line(obj, line, mtl);

            });
            obj.materials.push(mtl);
          }

          obj_string.split('\n').forEach(function (line) {
            parse_obj_line(obj, line);

          });





          faces.forEach(function (f) {
            f.vindex = obj_vertices.length / 3;

            if (f.indices.length === 3) {
              add_vertex(obj, f.indices.data[0]);
              add_vertex(obj, f.indices.data[1]);
              add_vertex(obj, f.indices.data[2]);
            }
            else if (f.indices.length === 4) {
              add_vertex(obj, f.indices.data[0]);
              add_vertex(obj, f.indices.data[1]);
              add_vertex(obj, f.indices.data[2]);

              add_vertex(obj, f.indices.data[0]);
              add_vertex(obj, f.indices.data[2]);
              add_vertex(obj, f.indices.data[3]);
            }

            if (f.normal.length === 3) {
              add_normal(obj, f.normal.data[0]);
              add_normal(obj, f.normal.data[1]);
              add_normal(obj, f.normal.data[2]);
            }
            else if (f.normal.length === 4) {
              add_normal(obj, f.normal.data[0]);
              add_normal(obj, f.normal.data[1]);
              add_normal(obj, f.normal.data[2]);

              add_normal(obj, f.normal.data[0]);
              add_normal(obj, f.normal.data[2]);
              add_normal(obj, f.normal.data[3]);
            }


            if (f.texture.length === 3) {

              add_uv(obj, f.texture.data[0]);
              add_uv(obj, f.texture.data[1]);
              add_uv(obj, f.texture.data[2]);
            }


          });


          obj.meshes = [];

          for (i = 0; i < facesMaterialsIndex.length; i += 2) {
            obj.meshes.push({
              mat: facesMaterialsIndex.data[i],
              draw_offset: faces[facesMaterialsIndex.data[i + 1]].vindex,
              draw_count: 0,
              name: faces[facesMaterialsIndex.data[i + 1]].obj_name
            });
          }


          for (i = 0; i < obj.meshes.length - 1; i++) {
            m = obj.meshes[i];
            m.draw_count = obj.meshes[i + 1].draw_offset - m.draw_offset;
          }
          m = obj.meshes[i];
          m.draw_count = (obj_vertices.length / 3) - m.draw_offset;


          var g = ge.geometry.geometry_data.create({
            vertices: obj_vertices.float32Array(),
            normals: obj_normals.length > 0 ? obj_normals.float32Array() : undefined,
            uvs: obj_uvs.length > 0 ? obj_uvs.float32Array() : undefined,
          });

          g.obj_meta = obj;


          for (i = 0; i < faces.length; i++) {
            faces_pool.free(faces[i]);
          }
          faces.length = 0;



          obj_vertices.clear();
          obj_normals.clear();
          obj_uvs.clear();
          facesMaterialsIndex.clear();

          vertices.clear();
          normals.clear();
          uvs.clear();

          return g;
        }
      }


    })();


    ge.geometry.shapes.gltf = (function () {

      var _gltf = {};

      _gltf.MODE_POINTS = 0; //Mode Constants for GLTF and WebGL are identical
      _gltf.MODE_LINES = 1; //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
      _gltf.MODE_LINE_LOOP = 2;
      _gltf.MODE_LINE_STRIP = 3;
      _gltf.MODE_TRIANGLES = 4;
      _gltf.MODE_TRIANGLE_STRIP = 5;
      _gltf.MODE_TRIANGLE_FAN = 6;

      _gltf.TYPE_BYTE = 5120;
      _gltf.TYPE_UNSIGNED_BYTE = 5121;
      _gltf.TYPE_SHORT = 5122;
      _gltf.TYPE_UNSIGNED_SHORT = 5123;
      _gltf.TYPE_UNSIGNED_INT = 5125;
      _gltf.TYPE_FLOAT = 5126;

      _gltf.COMP_SCALAR = 1;
      _gltf.COMP_VEC2 = 2;
      _gltf.COMP_VEC3 = 3;
      _gltf.COMP_VEC4 = 4;
      _gltf.COMP_MAT2 = 4;
      _gltf.COMP_MAT3 = 9;
      _gltf.COMP_MAT4 = 16;
      var prepare_buffer = function (json, idx) {
        var buf = json.buffers[idx];

        if (buf.dView != undefined) return buf;

        if (buf.uri.substr(0, 5) != "data:") {
          //TODO Get Bin File
          return buf;
        }

        //Create and Fill DataView with buffer data
        var pos = buf.uri.indexOf("base64,") + 7,
          blob = window.atob(buf.uri.substr(pos)),
          dv = new DataView(new ArrayBuffer(blob.length));
        for (var i = 0; i < blob.length; i++) dv.setUint8(i, blob.charCodeAt(i));
        buf.dView = dv;

        //console.log("buffer len",buf.byteLength,dv.byteLength);
        //var fAry = new Float32Array(blob.length/4);
        //for(var j=0; j < fAry.length; j++) fAry[j] = dv.getFloat32(j*4,true);
        //console.log(fAry);
        return buf;
      }

      var process_accessor = function (json, idx) {

        var a = json.accessors[idx],								//Accessor Alias Ref
          bView = json.bufferViews[a.bufferView],				//bufferView Ref

          buf = prepare_buffer(json, bView.buffer),					//Buffer Data decodes into a ArrayBuffer/DataView
          bOffset = (a.byteOffset || 0) + (bView.byteOffset || 0),	//Starting point for reading.
          bLen = 0,//a.count,//bView.byteLength,									//Byte Length for this Accessor

          TAry = null,												//Type Array Ref
          DFunc = null;												//DateView Function name

        //Figure out which Type Array we need to save the data in
        switch (a.componentType) {
          case _gltf.TYPE_FLOAT: TAry = Float32Array; DFunc = "getFloat32"; break;
          case _gltf.TYPE_SHORT: TAry = Int16Array; DFunc = "getInt16"; break;
          case _gltf.TYPE_UNSIGNED_SHORT: TAry = Uint16Array; DFunc = "getUint16"; break;
          case _gltf.TYPE_UNSIGNED_INT: TAry = Uint32Array; DFunc = "getUint32"; break;
          case _gltf.TYPE_UNSIGNED_BYTE: TAry = Uint8Array; DFunc = "getUint8"; break;

          default: console.log("ERROR processAccessor", "componentType unknown", a.componentType); return null; break;
        }

        //When more then one accessor shares a buffer, The BufferView length is the whole section
        //but that won't work, so you need to calc the partition size of that whole chunk of data
        //The math in the spec about stride doesn't seem to work, it goes over bounds, what Im using works.
        //https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#data-alignment
        if (bView.byteStride != undefined) bLen = bView.byteStride * a.count;
        else bLen = a.count * _gltf["COMP_" + a.type] * TAry.BYTES_PER_ELEMENT; //elmCnt * compCnt * compByteSize)

        //Pull the data out of the dataView based on the Type.
        var bPer = TAry.BYTES_PER_ELEMENT,	//How many Bytes needed to make a single element
          aLen = bLen / bPer,				//Final Array Length
          ary = new TAry(aLen),			//Final Array
          p = 0;						//Starting position in DataView

        for (var i = 0; i < aLen; i++) {
          p = bOffset + i * bPer;
          ary[i] = buf.dView[DFunc](p, true);
        }

        //console.log(a.type,GLTFLoader["COMP_"+a.type],"offset",bOffset, "bLen",bLen, "aLen", aLen, ary);
        return { data: ary, max: a.max, min: a.min, count: a.count, compLen: _gltf["COMP_" + a.type] };
      }



      var jtoskin = {}, j;

      return function (json) {
        console.log(json);

        var ret = {meshes:[]};

        json.nodes.forEach(function (n, ni) {

          if (n.children) {
            n.children.forEach(function (c, i) {
              n.children[i] = json.nodes[c];
              json.nodes[c].parent = n;
            });
          }

          if (n.mesh !== undefined) {
            n.mesh = json.meshes[n.mesh];
            if (!n.mesh.loaded) {
              n.mesh.geos = [];
              n.mesh.primitives.forEach(function (p) {
                console.log(p)
                var gm = {};
                if (p.attributes.POSITION !== undefined) {
                  gm.vertices = process_accessor(json, p.attributes.POSITION).data;
                }
                if (p.attributes.NORMAL !== undefined) {
                  gm.normals = process_accessor(json, p.attributes.NORMAL).data;
                }
                if (p.attributes.WEIGHTS_0 !== undefined) {
                  gm.weights = process_accessor(json, p.attributes.WEIGHTS_0).data;
                }
                if (p.attributes.JOINTS_0 !== undefined) {
                  gm.joints = new Float32Array(process_accessor(json, p.attributes.JOINTS_0).data);
                }

                if (p.indices !== undefined) {
                  gm.indices = process_accessor(json, p.indices).data;
                }

                ret.meshes.push(gm);
              });
            }
          }

          if (n.skin !== undefined) {
            n.skin = json.skins[n.skin];

            var skin = { joints: [] };
            var mats = process_accessor(json, n.skin.inverseBindMatrices);
            n.skin.joints.forEach(function (ji, ii) {

              j = json.nodes[ji];

              skin.joints[ii] = {
                name:j.name,
                pos: j.translation,
                rot: j.rotation,
                scale: [1,1,1],
                bind_pos: new Float32Array(mats.data.buffer, (ii * 16) * 4, 16)
              };


              if (ii > 0) {
                if (json.nodes[ji].parent) skin.joints[ii].pn = json.nodes[ji].parent.name;
              }

            });
            ret.skin = skin;
          }

        });

        json.scenes.forEach(function (s) {
         
          s.nodes.forEach(function (n,i) {
            s.nodes[i] = json.nodes[n];

          });

        });

        if (json.animations) {
          var samp, acc, min_time, max_time, di1, di2;
          json.animations.forEach(function (anim) {
            min_time = Infinity;
            max_time = -Infinity;
            anim.channels.forEach(function (chann) {
              samp = anim.samplers[chann.sampler];
              acc = process_accessor(json, samp.input);
              chann.times = acc.data;
              chann.a1 = acc;

              min_time = Math.min(min_time, acc.min[0]);
              max_time = Math.max(max_time, acc.max[0]);

              acc = process_accessor(json, samp.output);
              chann.values = acc.data;
              chann.vsize = acc.compLen;
              chann.a2 = acc;

            });

            anim.duration = max_time - min_time;

            anim.channels.forEach(function (chann) {
              chann.data = new Float32Array(chann.values.length + chann.times.length);
              chann.times.forEach(function (t, i) {
                //chann.times[i] = t / anim.duration;
                di1 = i * (chann.vsize + 1);
                chann.data[di1++] = t / anim.duration;
                di2 = i * chann.vsize;
                for (i = 0; i < chann.vsize-1; i++) {
                  chann.data[di1++] = chann.values[di2++];
                }
                
              });
            });

          });
        }
        return ret;

      }


      return function (json) {
        console.log(json);
        var ret = { geos: [], skins: [] };
        json.meshes.forEach(function (m) {
          var p, a;
          for (var i = 0; i < m.primitives.length; i++) {
            p = m.primitives[i];
            a = p.attributes;

            itm = {
              mode: p.mode != undefined ? p.mode : _gltf.MODE_TRIANGLES,
              indices: null, //p.indices
              vertices: null, //p.attributes.POSITION = vec3
              normals: null, //p.attributes.NORMAL = vec3
              texcoord: null, //p.attributes.TEXCOORD_0 = vec2
              joints: null, //p.attributes.JOINTS_0 = vec4
              weights: null, //p.attributes.WEIGHTS_0 = vec4
              armature: null
            };

            //Get Raw Data
            itm.vertices = process_accessor(json, a.POSITION);
            if (p.indices != undefined) itm.indices = process_accessor(json, p.indices);
            if (a.NORMAL != undefined) itm.normals = process_accessor(json, a.NORMAL);
            if (a.WEIGHTS_0 != undefined) itm.weights = process_accessor(json, a.WEIGHTS_0);
            if (a.JOINTS_0 != undefined) itm.joints = process_accessor(json, a.JOINTS_0);

            //NOTE : Spec pretty much states that a mesh CAN be made of up multiple objects, but each
            //object in reality is just a mesh with its own vertices and attributes. So each PRIMITIVE
            //is just a single draw call. For fungi I'm not going to build objects like this when
            //I export from mesh, so the first primitive in the mesh is enough for me.

            //May change the approach down the line if there is a need to have a single mesh
            //to be made up of sub meshes.

            //console.log(itm);
            var g = ge.geometry.geometry_data.create({
              vertices: itm.vertices.data,
              normals: itm.normals ? itm.normals.data : undefined,
              joints_weights: itm.weights ? itm.weights.data : undefined,
              joints_indices: itm.joints ? itm.joints.data : undefined,

            });





            if (itm.indices) g.set_indices(new Uint32Array(itm.indices.data));
            ret.geos.push(g);


          }


        });


        json.nodes.forEach(function (n, ni) {
         
          if (n.children) {
            n.children.forEach(function (c) {
              json.nodes[c].pr = ni;

            });
          }

        });
        json.skins.forEach(function (s) {
          var skin = { joints: [] };
          var mats = process_accessor(json, s.inverseBindMatrices);
          console.log(mats);
          s.joints.forEach(function (ji) {
            j = json.nodes[ji];


            jtoskin[ji] = skin.joints.length;


            skin.joints.push({
              name: j.name,
              pr: jtoskin[j.pr],
              position: j.translation,
              rotation: j.rotation,
              scale: j.scale,
              bind_pos2: new Float32Array(mats.data.buffer, (ji * 16) * 4, 16)

            });
          });



          
          ret.skins.push(skin);

        });
        console.log(ret);
        return ret;

      }
    })();


    ge.geometry.shapes.gltf2 = (function () {
      /**
 * Handle parsing data from GLTF Json and Bin Files
 * @example <caption></caption>
 * let aryPrim = Gltf.getMesh( names[0], json, bin );
 * let p = aryPrim[ 0 ];
 *
 * let vao = Vao.buildStandard( "Drill", p.vertices.compLen, p.vertices.data,
 *	(p.normal)?		p.normal.data	: null,
 *	(p.uv)? 		p.uv.data		: null,
 *	(p.indices)?	p.indices.data	: null );
 *
 * let e = App.$Draw( "Drill", vao, "LowPolyPhong", p.mode );
 * if( p.rotation )	e.Node.setRot( p.rotation );
 * if( p.position )	e.Node.setPos( p.position );
 * if( p.scale ) 	e.Node.setScl( p.scale );
 *
 * ---- OR ----
 * let vao = Vao.buildFromBin( "ToBufferTest", p, bin );
 * let e = App.$Draw( "BinBufTestMesh", vao, "LowPolyPhong", gl.ctx.TRIANGLES );
 * if( p.rotation )	e.Node.setRot( p.rotation );
 * if( p.position )	e.Node.setPos( p.position );
 * if( p.scale ) 	e.Node.setScl( p.scale );
 */
      var Gltf = (function () {
        function Gltf() {
        }
        ////////////////////////////////////////////////////////
        // HELPERS
        ////////////////////////////////////////////////////////
        /**
        * Parse out a single buffer of data from the bin file based on an accessor index. (Vertices, Normal, etc)
        * @param {number} idx - Index of an Accessor
        * @param {object} json - GLTF Json Object
        * @param {ArrayBuffer} bin - Array buffer of a bin file
        * @param {bool} specOnly - Returns only Buffer Spec data related to the Bin File
        * @public @return {data:TypeArray, min, max, elmCount, compLen, byteStart, byteLen, arrayType }
        */
        //https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_005_BuffersBufferViewsAccessors.md
        Gltf.parse_accessor = function (idx, json, bin, spec_only) {
          if (spec_only === void 0) { spec_only = false; }
          var acc = json.accessors[idx], bView = json.bufferViews[acc.bufferView], compLen = Gltf["COMP_" + acc.type], ary = null, byteStart = 0, byteLen = 0, TAry, DFunc; // Reference to GET function in Type Array
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Figure out which Type Array we need to save the data in
          switch (acc.componentType) {
            case Gltf.TYPE_FLOAT:
              TAry = Float32Array;
              DFunc = "getFloat32";
              break;
            case Gltf.TYPE_SHORT:
              TAry = Int16Array;
              DFunc = "getInt16";
              break;
            case Gltf.TYPE_UNSIGNED_SHORT:
              TAry = Uint16Array;
              DFunc = "getUint16";
              break;
            case Gltf.TYPE_UNSIGNED_INT:
              TAry = Uint32Array;
              DFunc = "getUint32";
              break;
            case Gltf.TYPE_UNSIGNED_BYTE:
              TAry = Uint8Array;
              DFunc = "getUint8";
              break;
            default:
              console.log("ERROR processAccessor", "componentType unknown", a.componentType);
              return null;
              break;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          var out = {
            min: acc.min,
            max: acc.max,
            elm_cnt: acc.count,
            comp_len: compLen
          };
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Data is Interleaved
          if (bView.byteStride) {
            if (spec_only)
              console.error("GLTF STRIDE SPEC ONLY OPTION NEEDS TO BE IMPLEMENTED ");
            /*
                The RiggedSimple sample seems to be using stride the wrong way. The data all works out
                but Weight and Joint indicate stride length BUT the data is not Interleaved in the buffer.
                They both exists in their own individual block of data just like non-Interleaved data.
                In the sample, Vertices and Normals ARE actually Interleaved. This make it a bit
                difficult to parse when dealing with interlanced data with WebGL Buffers.
      
                TODO: Can prob check if not interlanced by seeing if the Stride Length equals the length
                of the data in question.
                For example related to the RiggedSimple sample.
                Stride Length == FloatByteLength(4) * Accessor.type's ComponentLength(Vec3||Vec4)
                -- So if Stride is 16 Bytes
                -- The data is grouped as Vec4 ( 4 Floats )
                -- And Each Float = 4 bytes.
                -- Then Stride 16 Bytes == Vec4 ( 4f loats * 4 Bytes )
                -- So the stride length equals the data we're looking for, So the BufferView in question
                    IS NOT Interleaved.
      
                By the looks of things. If the Accessor.bufferView number is shared between BufferViews
                then there is a good chance its really Interleaved. Its ashame that things can be designed
                to be more straight forward when it comes to Interleaved and Non-Interleaved data.
             */
            // console.log("BView", bView );
            // console.log("Accessor", acc );
            var stride = bView.byteStride, elmCnt = acc.count, bOffset = (bView.byteOffset || 0), sOffset = (acc.byteOffset || 0), bPer = TAry.BYTES_PER_ELEMENT, aryLen = elmCnt * compLen, dView = new DataView(bin), p = 0, j = 0, k = 0; // Position Index of new Type Array
            ary = new TAry(aryLen); //Final Array
            //Loop for each element of by stride
            for (var i = 0; i < elmCnt; i++) {
              // Buffer Offset + (Total Stride * Element Index) + Sub Offset within Stride Component
              p = bOffset + (stride * i) + sOffset; //Calc Starting position for the stride of data
              //Then loop by compLen to grab stuff out of the DataView and into the Typed Array
              for (j = 0; j < compLen; j++)
                ary[k++] = dView[DFunc](p + (j * bPer), true);
            }
            out.data = ary;
          }
          else {
            if (spec_only) {
              out.array_type = TAry.name.substring(0, TAry.name.length - 5);
              out.byte_start = (acc.byteOffset || 0) + (bView.byteOffset || 0);
              out.byte_cnt = acc.count * compLen * TAry.BYTES_PER_ELEMENT;
            }
            else {
              var bOffset = (acc.byteOffset || 0) + (bView.byteOffset || 0);
              out.data = new TAry(bin, bOffset, acc.count * compLen); // ElementCount * ComponentLength
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          return out;
        };
        ////////////////////////////////////////////////////////
        // MESH
        ////////////////////////////////////////////////////////
        /**
        * Returns the geometry data for all the primatives that make up a Mesh based on the name
        * that the mesh appears in the nodes list.
        * @param {string} name - Name of a node in the GLTF Json file
        * @param {object} json - GLTF Json Object
        * @param {ArrayBuffer} bin - Array buffer of a bin file
        * @param {bool} specOnly - Returns only Buffer Spec data related to the Bin File
        * @public @return {Array.{name,mode,position,vertices,normal,uv,weights,joints}}
        */
        Gltf.get_mesh = function (name, json, bin, spec_only) {
          if (spec_only === void 0) { spec_only = false; }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Find Mesh to parse out.
          var i, n = null, mesh_idx = null;
          for (var _i = 0, _a = json.nodes; _i < _a.length; _i++) {
            i = _a[_i];
            if (i.name === name && i.mesh != undefined) {
              n = i;
              mesh_idx = n.mesh;
              break;
            }
          }
          //No node Found, Try looking in mesh array for the name.
          if (!n) {
            for (i = 0; i < json.meshes.length; i++)
              if (json.meshes[i].name == name) {
                mesh_idx = i;
                break;
              }
          }
          if (mesh_idx == null) {
            console.error("Node or Mesh by the name", name, "not found in GLTF");
            return null;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Loop through all the primatives that make up a single mesh
          var m = json.meshes[mesh_idx], pLen = m.primitives.length, ary = new Array(pLen), itm, prim, attr;
          for (var i_1 = 0; i_1 < pLen; i_1++) {
            //.......................................
            // Setup some vars
            prim = m.primitives[i_1];
            attr = prim.attributes;
            itm = {
              name: name + ((pLen != 1) ? "_p" + i_1 : ""),
              mode: (prim.mode != undefined) ? prim.mode : Gltf.MODE_TRIANGLES
            };
            //.......................................
            // Save Position, Rotation and Scale if Available.
            if (n) {
              if (n.translation)
                itm.position = n.translation.slice(0);
              if (n.rotation)
                itm.rotation = n.rotation.slice(0);
              if (n.scale)
                itm.scale = n.scale.slice(0);
            }
            //.......................................
            // Parse out all the raw Geometry Data from the Bin file
            itm.vertices = Gltf.parse_accessor(attr.POSITION, json, bin, spec_only);
            if (prim.indices != undefined)
              itm.indices = Gltf.parse_accessor(prim.indices, json, bin, spec_only);
            if (attr.NORMAL != undefined)
              itm.normal = Gltf.parse_accessor(attr.NORMAL, json, bin, spec_only);
            if (attr.TEXCOORD_0 != undefined)
              itm.uv = Gltf.parse_accessor(attr.TEXCOORD_0, json, bin, spec_only);
            if (attr.WEIGHTS_0 != undefined)
              itm.weights = Gltf.parse_accessor(attr.WEIGHTS_0, json, bin, spec_only);
            if (attr.JOINTS_0 != undefined)
              itm.joints = Gltf.parse_accessor(attr.JOINTS_0, json, bin, spec_only);
            //.......................................
            // Save to return array
            ary[i_1] = itm;
          }
          return ary;
        };
        ////////////////////////////////////////////////////////
        // SKIN
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
        // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_020_Skins.md
        ////////////////////////////////////////////////////////
        // This one uses the Inverted Bind Matrices in the bin file then converts
        // to local space transforms.
        Gltf.get_skin = function (json, bin, name, node_info) {
          if (name === void 0) { name = null; }
          if (node_info === void 0) { node_info = null; }
          if (!json.skins) {
            console.error("There is no skin in the GLTF file.");
            return null;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Skin Checking
          var ji, skin = null;
          if (name != null) {
            for (var _i = 0, _a = json.skins; _i < _a.length; _i++) {
              ji = _a[_i];
              if (ji.name == name) {
                skin = ji;
                break;
              }
            }
            if (!skin) {
              console.error("skin not found", name);
              return null;
            }
          }
          else {
            // Not requesting one, Use the first one available
            for (var _b = 0, _c = json.skins; _b < _c.length; _b++) {
              ji = _c[_b];
              skin = ji;
              name = ji.name; // Need name to fill in node_info
              break;
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create Bone Items
          var boneCnt = skin.joints.length, bones = new Array(boneCnt), n2j = {}, n, ni, itm; // Bone Item
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create Bone Array and Loopup Table.
          for (ji = 0; ji < boneCnt; ji++) {
            ni = skin.joints[ji];
            n2j["n" + ni] = ji;
            bones[ji] = {
              idx: ji, p_idx: null, lvl: 0, name: null,
              pos: null, rot: null, scl: null
            };
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Get Bone's name and set it's parent index value
          for (ji = 0; ji < boneCnt; ji++) {
            n = json.nodes[skin.joints[ji]];
            itm = bones[ji];
            // Each Bone Needs a Name, create one if one does not exist.
            if (n.name === undefined || n.name == "")
              itm.name = "bone_" + ji;
            else {
              itm.name = n.name.replace("mixamorig:", "");
            }
            // Set Children who the parent is.
            if (n.children && n.children.length > 0) {
              for (var _d = 0, _e = n.children; _d < _e.length; _d++) {
                ni = _e[_d];
                bones[n2j["n" + ni]].p_idx = ji;
              }
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Set the Hierarchy Level for each bone
          var lvl;
          for (ji = 0; ji < boneCnt; ji++) {
            // Check for Root Bones
            itm = bones[ji];
            if (itm.p_idx == null) {
              itm.lvl = 0;
              continue;
            }
            // Traverse up the tree to count how far down the bone is
            lvl = 0;
            while (itm.p_idx != null) {
              lvl++;
              itm = bones[itm.p_idx];
            }
            bones[ji].lvl = lvl;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Get Parent Node Transform, Node with the same name as the armature.
          if (node_info) {
            for (var _f = 0, _g = json.nodes; _f < _g.length; _f++) {
              ji = _g[_f];
              if (ji.name == name) {
                if (ji.rotation)
                  node_info["rot"] = ji.rotation;
                if (ji.scale)
                  node_info["scl"] = ji.scale;
                if (ji.position)
                  node_info["pos"] = ji.position;
                break;
              }
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Bind Pose from Inverted Model Space Matrices
          var bind = Gltf.parse_accessor(skin.inverseBindMatrices, json, bin),
            m0 = new Mat4(),
            m1 = new Mat4(),
            near_one = function (v) {
              if (1 - Math.abs(v[0]) <= 1e-4)
                v[0] = 1;
              if (1 - Math.abs(v[1]) <= 1e-4)
                v[1] = 1;
              if (1 - Math.abs(v[2]) <= 1e-4)
                v[2] = 1;
              return v;
            };
          for (ji = 0; ji < boneCnt; ji++) {
            itm = bones[ji];
            // If no parent bone, The inverse is enough
            if (itm.p_idx == null) {
              m1.copy(bind.data, ji * 16).invert();
            }
            else {
              m0.copy(bind.data, itm.p_idx * 16); // Parent Bone Inverted
              m1.copy(bind.data, ji * 16).invert(); // Child Bone UN-Inverted
              Mat4.mul(m0, m1, m1);
            }
            itm.pos = m1.get_translation(new Vec3()).near_zero();
            itm.rot = m1.get_rotation(new Quat()).norm();
            itm.scl = near_one(m1.get_scale(new Vec3()));
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          return bones;
        };
        // Uses the nodes to get the local space bind pose transform. But the real bind pose
        // isn't always available there, blender export has a habit of using the current pose/frame in nodes.
        Gltf.get_skin_by_nodes = function (json, name, node_info) {
          if (name === void 0) { name = null; }
          if (node_info === void 0) { node_info = null; }
          if (!json.skins) {
            console.error("There is no skin in the GLTF file.");
            return null;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Skin Checking
          var ji, skin = null;
          if (name != null) {
            for (var _i = 0, _a = json.skins; _i < _a.length; _i++) {
              ji = _a[_i];
              if (ji.name == name) {
                skin = ji;
                break;
              }
            }
            if (!skin) {
              console.error("skin not found", name);
              return null;
            }
          }
          else {
            // Not requesting one, Use the first one available
            for (var _b = 0, _c = json.skins; _b < _c.length; _b++) {
              ji = _c[_b];
              skin = ji;
              name = ji.name; // Need name to fill in node_info
              break;
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create Bone Items
          var boneCnt = skin.joints.length, bones = new Array(boneCnt), n2j = {}, n, ni, itm; // Bone Item
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create Bone Array and Loopup Table.
          for (ji = 0; ji < boneCnt; ji++) {
            ni = skin.joints[ji];
            n2j["n" + ni] = ji;
            bones[ji] = {
              idx: ji, p_idx: null, lvl: 0, name: null,
              pos: null, rot: null, scl: null
            };
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Collect bone information, inc
          for (ji = 0; ji < boneCnt; ji++) {
            n = json.nodes[skin.joints[ji]];
            itm = bones[ji];
            // Get Transform Data if Available
            if (n.translation)
              itm.pos = n.translation.slice(0);
            if (n.rotation)
              itm.rot = n.rotation.slice(0);
            // Each Bone Needs a Name, create one if one does not exist.
            if (n.name === undefined || n.name == "")
              itm.name = "bone_" + ji;
            else {
              itm.name = n.name.replace("mixamorig:", "");
            }
            // Scale isn't always available
            if (n.scale) {
              // Near Zero Testing, Clean up the data because of Floating point issues.
              itm.scl = n.scale.slice(0);
              if (Math.abs(1 - itm.scl[0]) <= 0.000001)
                itm.scl[0] = 1;
              if (Math.abs(1 - itm.scl[1]) <= 0.000001)
                itm.scl[1] = 1;
              if (Math.abs(1 - itm.scl[2]) <= 0.000001)
                itm.scl[2] = 1;
            }
            // Set Children who the parent is.
            if (n.children && n.children.length > 0) {
              for (var _d = 0, _e = n.children; _d < _e.length; _d++) {
                ni = _e[_d];
                bones[n2j["n" + ni]].p_idx = ji;
              }
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Set the Hierarchy Level for each bone
          var lvl;
          for (ji = 0; ji < boneCnt; ji++) {
            // Check for Root Bones
            itm = bones[ji];
            if (itm.p_idx == null) {
              itm.lvl = 0;
              continue;
            }
            // Traverse up the tree to count how far down the bone is
            lvl = 0;
            while (itm.p_idx != null) {
              lvl++;
              itm = bones[itm.p_idx];
            }
            bones[ji].lvl = lvl;
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Set the Hierarchy Level for each bone
          if (node_info) {
            for (var _f = 0, _g = json.nodes; _f < _g.length; _f++) {
              ji = _g[_f];
              if (ji.name == name) {
                if (ji.rotation)
                  node_info["rot"] = ji.rotation;
                if (ji.scale)
                  node_info["scl"] = ji.scale;
                if (ji.position)
                  node_info["pos"] = ji.position;
                break;
              }
            }
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          return bones;
        };
        ////////////////////////////////////////////////////////
        // ANIMATION
        ////////////////////////////////////////////////////////
        /*
        https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
        https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation (Has math for cubic spline)
      
        animation = {
            frame_cnt		: int
            time			: float,
            times			: [ float32array, float32array, etc ],
            tracks			: [
                {
                    type		: "rot || pos || scl",
                    time_idx 	: 0,
                    joint_idx	: 0,
                    lerp 		: "LINEAR || STEP || CUBICSPLINE",
                    data		: float32array,
                },
            ]
        }
        */
        Gltf.get_animation = function (json, bin, name, limit) {
          if (name === void 0) { name = null; }
          if (limit === void 0) { limit = true; }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Validate there is animations and an anaimtion by a name exists in the json file.
          if (json.animations === undefined || json.animations.length == 0) {
            console.error("There is no animations in gltf");
            return null;
          }
          var i, a = null;
          if (name) {
            for (var _i = 0, _a = json.animations; _i < _a.length; _i++) {
              i = _a[_i];
              if (i.name === name) {
                a = i;
                break;
              }
            }
            if (!a) {
              console.error("Animation by the name", name, "not found in GLTF");
              return null;
            }
          }
          else
            a = json.animations[0]; // No Name, Grab First One.
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create Lookup Table For Node Index to Bone Index.
          var joints = {}, j_ary = json.skins[0].joints;
          for (i = 0; i < j_ary.length; i++) {
            joints[j_ary[i]] = i; // Node Index to Joint Index
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          var chi = 0, ch, s, n, prop, t_idx, n_name, s_time, ch_ary = [], time_ary = [], time_tbl = {}, time_max = 0, frame_max = 0;
          for (chi = 0; chi < a.channels.length; chi++) {
            //.......................
            // Must check that the channel points to a node that the animation is attached to.
            ch = a.channels[chi];
            if (ch.target.node == undefined)
              continue;
            n = ch.target.node;
            if (joints[n] == undefined) {
              console.log("Channel's target node is not a joint of the first skin.");
              continue;
            }
            //.......................
            // User a smaller property name then what GLTF uses.
            switch (ch.target.path) {
              case "rotation":
                prop = "rot";
                break;
              case "translation":
                prop = "pos";
                break;
              case "scale":
                prop = "scl";
                break;
              default:
                console.log("unknown channel path", ch.path);
                continue;
            }
            //.......................
            // When limit it set, only want rotation tracks and if its the hip, position to.
            n_name = json.nodes[n].name.toLowerCase();
            if (limit &&
              !(prop == "rot" ||
                (n_name.indexOf("hip") != -1 && prop == "pos")))
              continue;
            //.......................
            // Parse out the Sampler Data from the Bin file.
            s = a.samplers[ch.sampler];
            // Get Time for all keyframes, cache it since its shared.
            t_idx = time_tbl[s.input];
            if (t_idx == undefined) {
              time_tbl[s.input] = t_idx = time_ary.length;
              s_time = this.parse_accessor(s.input, json, bin);
              time_ary.push(s_time.data);
              time_max = Math.max(time_max, s_time.max[0]);
              frame_max = Math.max(frame_max, s_time.data.length);
            }
            //.......................
            // Get the changing value per frame for the property
            ch_ary.push({
              type: prop,
              time_idx: t_idx,
              joint_idx: joints[n],
              interp: s.interpolation,
              data: this.parse_accessor(s.output, json, bin).data
            });
          }
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          var rtn = { time: time_max, frame_cnt: frame_max, times: time_ary, tracks: ch_ary };
          return rtn;
        };
        ////////////////////////////////////////////////////////
        // MISC
        ////////////////////////////////////////////////////////
        // Binary Buffer can exist in GLTF file encoded in base64. 
        // This function converts the data into an ArrayBuffer.
        Gltf.parse_b64_buffer = function (json) {
          var buf = json.buffers[0];
          if (buf.uri.substr(0, 5) != "data:")
            return null;
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          // Create and Fill DataView with buffer data
          var pos = buf.uri.indexOf("base64,") + 7, blob = window.atob(buf.uri.substr(pos)), ary_buf = new ArrayBuffer(blob.length), dv = new DataView(ary_buf);
          for (var i = 0; i < blob.length; i++)
            dv.setUint8(i, blob.charCodeAt(i));
          return ary_buf;
        };
        return Gltf;
      })();
      ////////////////////////////////////////////////////////
      // CONSTANTS
      ////////////////////////////////////////////////////////
      Gltf.MODE_POINTS = 0; // Mode Constants for GLTF and WebGL are identical
      Gltf.MODE_LINES = 1; // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
      Gltf.MODE_LINE_LOOP = 2;
      Gltf.MODE_LINE_STRIP = 3;
      Gltf.MODE_TRIANGLES = 4;
      Gltf.MODE_TRIANGLE_STRIP = 5;
      Gltf.MODE_TRIANGLE_FAN = 6;
      Gltf.TYPE_BYTE = 5120;
      Gltf.TYPE_UNSIGNED_BYTE = 5121;
      Gltf.TYPE_SHORT = 5122;
      Gltf.TYPE_UNSIGNED_SHORT = 5123;
      Gltf.TYPE_UNSIGNED_INT = 5125;
      Gltf.TYPE_FLOAT = 5126;
      Gltf.COMP_SCALAR = 1; // Component Length based on Type
      Gltf.COMP_VEC2 = 2;
      Gltf.COMP_VEC3 = 3;
      Gltf.COMP_VEC4 = 4;
      Gltf.COMP_MAT2 = 4;
      Gltf.COMP_MAT3 = 9;
      Gltf.COMP_MAT4 = 16;
      Gltf.TARGET_ARY_BUF = 34962; // bufferview.target
      Gltf.TARGET_ELM_ARY_BUF = 34963;

      




      return function (json) {
        console.log(json);


      }
    })();


  })();
  



  ge.geometry.shapes.flat_quad = new ge.geometry.geometry_data();

  ge.geometry.shapes.flat_quad.add_attribute('a_position_rw', {
    item_size: 3, data: new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      1, 1, 0,
      -1, -1, 0,
      1, 1, 0,
      -1, 1, 0
    ])
  });
  ge.geometry.shapes.flat_quad.num_items = 12;












  ge.geometry.mesh = ge.define(function (proto, _super) {

    function ge_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);

      this.geometry = def.geometry || null;
      this.material = def.material || null;

      this.has_multi_materials = false;
      if (this.material && this.material.length>0) {
        this.has_multi_materials = true;
      }
      this.draw_offset = def.draw_offset || 0;
      if (!def.draw_count) {
        if (this.geometry !== null) this.draw_count = this.geometry.num_items;
      }
      else {
        this.draw_count = def.draw_count;
      }
     
      this.item_type = 4;
      this.flags = def.flags || 0;

    }
    proto.update_bounds = function (mat, trans) {
      math.aabb.transform_mat4(this.bounds, this.geometry.aabb, mat);
      this.bounds_sphere = this.geometry.bounds_sphere * trans.scale[0];
    };

    return ge_mesh;
  }, ge.renderable);






  ge.geometry.mesh.triangles = ge.define(function (proto, _super) {



    var ii = 0;
    proto.add = function (x0, y0, z0, x1, y1, z1, x2, y2, z2) {
      ii = this.ii;

      this.vertices[ii++] = x0;
      this.vertices[ii++] = y0;
      this.vertices[ii++] = z0;

      this.vertices[ii++] = x1;
      this.vertices[ii++] = y1;
      this.vertices[ii++] = z1;

      this.vertices[ii++] = x2;
      this.vertices[ii++] = y2;
      this.vertices[ii++] = z2;

      this.ii = ii;

      this.geometry.attributes.a_position_rw.data_length = ii;
      this.geometry.attributes.a_position_rw.needs_update = true;

      this.draw_count = ii/3;

      return this;

    

    }


    proto.render_list = function () {
      if (this.geometry.attributes.a_position_rw.needs_update) {
        ge.geometry.geometry_data.calc_normals(this.geometry);
      }

    }

    function ge_mesh_triangle(def) {
      def = def || {};
      _super.apply(this, [def]);
      def.max_triangles = def.max_triangles || 1000;


      this.vertices = new Float32Array(def.max_triangles * 9);
      this.geometry = ge.geometry.geometry_data.create({
        vertices: this.vertices,
        normals: new Float32Array(this.vertices.length)
      })
      this.material = def.material || null;
      this.ii = 0;
      this.draw_offset = 0;
      this.draw_count =0;
      this.item_type = 4;
      this.flags = def.flags || 0;
      if (def.triangles) {
        for (var i = 0; i < def.triangles.length; i++) {
          this.add.apply(this, def.triangles[i]);
        }
      }

    }
   

    return ge_mesh_triangle;
  }, ge.renderable);


}})()(_FM["fin"],_FM["ge"],_FM["math"]);
(function() { return function cui(fin, ge,math) { 
  ge.cui = ge.define(function (proto, _super) {
    var ge_cui;


   

    proto.bubble_event = function (node, e, params) {
      if (!node) return;
      if (node[e]) {
        node[e].apply(node, params);
      }
      else this.bubble_event(node.parent,e, params);
    }

    proto.set_mouse_position = function (x, y, button) {


      x = Math.floor(x);
      y = Math.floor(y);

      
      this.mouse_x = x;
      this.mouse_y = y;

      this.mouse_dx = this.mouse_x - this.last_mouse_x;
      this.mouse_dy = this.mouse_y - this.last_mouse_y;

      this.mouse_down_dx = this.mouse_x - this.mouse_down_x;
      this.mouse_down_dy = this.mouse_y - this.mouse_down_y;


      this.mouse_down_delta = Math.sqrt(this.mouse_down_dx * this.mouse_down_dx + this.mouse_down_dy * this.mouse_down_dy);
      this.mouse_delta = Math.sqrt(this.mouse_dx * this.mouse_dx + this.mouse_dy * this.mouse_dy);



      if (button === this.mouse_button && this.mouse_delta === 0) {      
        this.last_mouse_x = x;
        this.last_mouse_y = y;
        if (button === 1) {          
          this.mouse_down_x = x;
          this.mouse_down_y = y;          
        }
        return false ;

      }

      this.mouse_is_moving = false;
      if (this.mouse_delta!==0) {
        this.mouse_is_moving = true;
      }

     
      this.mouse_click = false;
      

      if (this.mouse_down && button === 0 && !this.last_mouse_draging) {
        if (!this.mouse_is_moving && this.mouse_down_delta === 0) {
          this.mouse_click = true;
          this.mouse_down = false;
         // console.log("mouse click");
        }

      }
      this.mouse_draging = false;
      if (this.mouse_down && this.mouse_down_delta !== 0) {
        //console.log("mouse_draging", this.mouse_down_delta);
        this.mouse_draging = true;
        
      }

      if (button === 1 && !this.mouse_down && !this.mouse_draging) {
        this.mouse_down = true;
        this.mouse_down_x = x;
        this.mouse_down_y = y;
       // console.log("mouse_down");
      }
      else {
        if (button === 0) {
          this.mouse_down = false;    
          
        }
      }
      

      this.last_mouse_x = x;
      this.last_mouse_y = y;
      this.mouse_button = button;


      if (this.mouse_down && !this.mouse_draging ) {
        this.mouse_node_id = 0;
        this.mouse_hit_node(this.doc.body, this.doc);
      }



      if (this.mouse_node_id !== 0) {
        var node = this.doc.nodes[this.mouse_node_id];
        if (node) {
          if (this.mouse_draging) {
            if (node.on_mouse_draging) {
              node.on_mouse_draging(node, this.mouse_dx, this.mouse_dy);
            }
            else {
              this.bubble_event(node.parent, "on_mouse_draging", [node, this.mouse_dx, this.mouse_dy]);
            }
          }
          else if (this.mouse_down && !this.mouse_draging) {
            if (node.on_mouse_down) {
              node.on_mouse_down(node, this.mouse_down_x, this.mouse_down_y);
            }
            else {
              
            }
          }
          else if (this.mouse_click) {
            if (node.on_mouse_click) {
              node.on_mouse_click(node, this.mouse_x, this.mouse_y);
            }
            else {
              this.bubble_event(node.parent, "on_mouse_click", [node, this.mouse_x, this.mouse_y]);
            }
          }
        }
      }

      this.last_mouse_draging = this.mouse_draging;
      this.mouse_draging = false;
    //  this.mouse_down_x = x;
   //   this.mouse_down_y = y;
      if (this.mouse_button === 0) this.mouse_node_id = 0;
      return true;
      
    }



    proto.render_node = function (ctx,node, parent) {
     
      if (node.render) {
        node.render(ctx, node, this, this.components[node.type]);
      }
      else {
        this.components[node.type].render(ctx, node, this);
      }
      
      node.actual_height = node._height;
      node.actual_width = node._width;


     
      node.gx = node._x + parent.gx;
      node.gy = node._y + parent.gy;

           
      if (node.children) {
        var child;
        if (node.styles.overflow === "hidden") {
          ctx.beginPath();
          ctx.rect(node.styles.padding_left, node.styles.padding_top,
            node._width - (node.styles.padding_left + node.styles.padding_right)
            , node._height- (node.styles.padding_top + node.styles.padding_bottom)

          );
          ctx.clip();

        }
        ctx.translate(-node.scroll_left, -node.scroll_top);
        var y = node.styles.padding_top, x = node.styles.padding_left,last_node_height=0;
        for (var i = 0; i < node.children.length; i++) {
          child = node.children[i];
          if (!child.styles.visibled) continue;

          if (x + child._width + node.styles.padding_right > node._width) {
            x = node.styles.padding_left;
            y += last_node_height;
          }

          if (child.styles.position === "absolute") {
            x = 0; y = 0;
          }

          x += child._left + child.styles.margin_left;
          y += child._top + child.styles.margin_top;

        


          
          ctx.save();
          ctx.translate(x, y + child.styles.margin_top);
          
          child._x = x - node.scroll_left;
          child._y = ((y + child.styles.margin_top) - node.scroll_top);

          x += this.render_node(ctx, child, node);
          ctx.restore();
          last_node_height = child.actual_height + child.styles.margin_bottom;
        }
      }
      

      
      node.initiated = true;
      return node.actual_width;
    }


    proto.mouse_hit_node = function (node, parent) {


      if (!node.styles.visibled) return;
      if (this.mouse_x > node.gx && this.mouse_x < node.gx + node.actual_width) {
        if (this.mouse_y > node.gy && this.mouse_y < node.gy + node.actual_height) {
          if (node.styles.mouse_events) this.mouse_node_id = node.uuid;
          if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
              this.mouse_hit_node(node.children[i], node);
            }
          }

        }
      }
    };

    proto.get_node = function (name) {
      return this.doc.nodes_names[name];

    };

    proto.init_node = function (node, parent) {
      if (!node.initiated) {

        node.uuid = ge.guidi();
        
        this.doc.nodes[node.uuid] = node;

        node.name = node.name || ("n" + node.uuid);


        this.doc.nodes_names[node.name] = node;

        node.document = parent.document ? parent.document : parent;

        node.scroll_left = node.scroll_left || 0;
        node.scroll_top = node.scroll_top || 0;


       

        node.type = node.type || "block";

        node.left = node.left || "0px";
        node.top = node.top || "0px";

        node.styles = node.styles || {};


        if (node.styles.padding) {
          if (node.styles.padding_left === undefined) node.styles.padding_left = node.styles.padding;
          if (node.styles.padding_right === undefined) node.styles.padding_right = node.styles.padding;
          if (node.styles.padding_top === undefined) node.styles.padding_top = node.styles.padding;
          if (node.styles.padding_bottom === undefined) node.styles.padding_bottom = node.styles.padding;

        }

        if (this.components[node.type].init) {
          this.components[node.type].init(node, parent, this);
        }
        node.height = node.height || "100%";
        node.width = node.width || "100%";

        var pw = (parent._width - (parent.styles.padding_left + parent.styles.padding_right));
        var ph = (parent._height - (parent.styles.padding_top + parent.styles.padding_bottom));



        if (node.left.indexOf("%") > 0) {
          node._left = (parseFloat(node.left) / 100) * pw;
        }
        else {
          node._left = parseFloat(node.left);
        }


        if (node.top.indexOf("%") > 0) {
          node._top = (parseFloat(node.top) / 100) * ph;
        }
        else {
          node._top = parseFloat(node.top);
        }






        if (node.width.indexOf("%") > 0) {
          node._width = (parseFloat(node.width) / 100) * pw;
        }
        else {
          node._width = parseFloat(node.width);
        }
        node.parent = parent;

        if (node.height.indexOf("%") > 0) {
          node._height = (parseFloat(node.height) / 100) * ph;
        }
        else {
          node._height = parseFloat(node.height);
        }

        node._x = 0;
        node._y = 0;

       
        for (var s in this.styles) {
          if (node.styles[s] === undefined) {
            node.styles[s] = this.styles[s];
          }
        }
        if (node.on_init) node.on_init(node, parent);

        if (node.styles.background_color.join) {
          ge_cui.images_loader.load(node.styles.background_color[0], [
            ge_cui.background_pattern_creator,
            node,
            this,
            node.styles.background_color[1] || "repeat",
            node.styles.background_color[2]
          ]);
          node.styles.background_color = "transparent";
        }

        node.initiated = true;
        if (node.children) {

          for (var i = 0; i < node.children.length; i++) {
            node.children[i].index = i;
            this.init_node(node.children[i], node);
          }
        }
      }


    };


    proto.display_document = function (doc) {
      if (doc) {
        this.doc = doc;
      }
      else {
        doc = this.doc;

      }
      
      doc._width = this.canv.width;
      doc._height = this.canv.height;
      doc.gx = 0; doc.gy = 0;
      
      if (!doc.body.initiated) {
        for (var k in ge_cui.components) {
          this.components[k] = ge_cui.components[k];
        }

    
        doc.styles = this.styles;
        this.doc.nodes = {};
        this.doc.nodes_names = {};

        
        this.init_node(doc.body, doc);
        

      }
      this.canv.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
      this.render_node(this.canv.ctx, doc.body, doc);
      this.canv.ctx.fillStyle = "rgba(10,10,10,0.37)";
      this.canv.ctx.fillRect(this.mouse_x-3, this.mouse_y-3, 6, 6);
      

     
      
    }


    ge_cui = function (def) {
      def = def || {};

      fin.merge_object({
        width: 512,
        height: 512
      }, def, true);

      this.components = {};

      
      this.canv = ge.create_canvas(def.width, def.height);
      this.mouse_node_id = 0;
      this.mouse_x = -10;
      this.mouse_y = -10;
      this.last_mouse_x = 0;
      this.last_mouse_y = 0;

      this.mouse_dx = 0;
      this.mouse_dy = 0;

     

      this.styles = {
        font: "arial",
        font_size: 12,
        text_valign: "top",
        text_align:"left",                
        background_color: "transparent",
        background_alpha:1,
        foreground_color: "black",
        margin_left: 0,
        margin_right: 0,
        margin_top: 0,
        margin_bottom: 0,
        padding_left: 0,
        padding_right: 0,
        padding_top: 0,
        padding_bottom: 0,        
        overflow: "visible",
        position: "relative",
        mouse_events: true,
        visibled: true,
        border_size: 0,
        border_type: "outset",
        border_color:"transparent",
        focus_rect:false
      }
      this.doc = null;
    };


    ge_cui.load_images = {};
    ge_cui.load_image = function (url) {
      if (ge_cui.load_images[url]) return ge_cui.load_images[url];

      var img = new Image();
      img.src = url;
      ge_cui.load_images[url] = img;

      return img;


    }


    ge_cui.background_pattern_creator = (function () {
      var canv = ge.create_canvas(1, 1);
      return function (img, node, ui, repeat, size) {

        size = size || 64;

        canv.set_size(size, size);
        canv.ctx.drawImage(img, 0, 0,size,size);


        node.styles.background_color = ui.canv.ctx.createPattern(canv, repeat);
        ui.needs_update = true;
      }
    })();

    ge_cui.images_loader = new ge.bulk_image_loader(5);
   

    ge_cui.images_loader.onload = (function () {
     
      return function (img, params) {
        var func = params[0];
        params[0] = img;
        func.apply(this, params);             
        ge_cui.images_loader.free(img);

      }
    })();


    ge_cui.components = {};

    ge_cui.define_component = function (name, comp) {
      this.components[name] = comp;
      comp.ui = this;
    };

    ge_cui.define_component("block", {
      render: function (ctx, node, ui) {
        //  if (node.styles.background_color === "transparent") return;

        if (node.styles.background_color !== "transparent") {
          ctx.fillStyle = node.styles.background_color;
          ctx.globalAlpha = node.styles.background_alpha;

          ctx.fillRect(0, 0, node._width, node._height);

        }
        ctx.globalAlpha  = 1.0;

        if (node.styles.border_size > 0) {
          ctx.lineWidth = node.styles.border_size;


          ctx.strokeStyle = node.styles.border_color;
          ctx.strokeRect(0, 0, node._width, node._height);

          if (node.styles.border_type === "outset") {
            ctx.strokeStyle = "rgba(110,110,110,0.5)";
            ctx.beginPath();
            ctx.moveTo(0, node._height);
            ctx.lineTo(0, 0);
            ctx.lineTo(node._width, 0);
            ctx.stroke();
            ctx.strokeStyle = "rgba(50,50,50,0.5)";
            ctx.beginPath();
            ctx.moveTo(0, node._height);
            ctx.lineTo(node._width, node._height);
            ctx.lineTo(node._width, 0);
            ctx.stroke();
          }
          else if (node.styles.border_type === "inset") {
            ctx.strokeStyle = "rgba(50,50,50,0.5)";
            ctx.beginPath();
            ctx.moveTo(0, node._height);
            ctx.lineTo(0, 0);
            ctx.lineTo(node._width, 0);
            ctx.stroke();
            ctx.strokeStyle = "rgba(110,110,110,0.5)";
            ctx.beginPath();
            ctx.moveTo(0, node._height);
            ctx.lineTo(node._width, node._height);
            ctx.lineTo(node._width, 0);
            ctx.stroke();
          }



        }


        ctx.lineWidth = 1;

        if (node.uuid === ui.mouse_node_id) {
          if (ui.mouse_down && node.styles.focus_rect) {
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(0, 0, node._width, node._height);

          }
        }

      }
    });


    ge_cui.define_component("scroll-panel", {
      init: function (node, parent, ui) {
        node.styles.overflow = "hidden";

        node.on_mouse_draging = function (node, dx, dy) {
          this.scroll_top -= dy;
          this.scroll_top = Math.max(this.scroll_top, 0);
        }

      },
      render: function (ctx, node, ui) {
        ge_cui.components["block"].render(ctx, node, ui);
      }
    });


    ge_cui.define_component("text", {
      init: function (node, parent, ui) {
        if (node.height === undefined) node.height = "20px";
        if (node.styles['mouse_events'] === undefined) {
          node.styles['mouse_events'] = false;
        }

        if (node.styles['background_color'] === undefined) {
          node.styles['background_color'] = 'transparent';
        }
      },
      render: function (ctx, node, ui) {

        ctx.font = node.styles.font_size + "px " + node.styles.font;


        if (node._text !== node.text) {
          node._text_m = ctx.measureText(node.text);
          node._text = node.text;
          node._height = Math.max(node._height, node._text_m.actualBoundingBoxDescent + node.styles.padding_top + node.styles.padding_bottom);
          node._width = Math.max(node._width, node._text_m.width + node.styles.padding_left + node.styles.padding_right);
        }


        var x = node.styles.padding_left, y = node.styles.padding_top;

        ge_cui.components["block"].render(ctx, node, ui);

        ctx.textAlign = node.styles.text_align;
        ctx.textBaseline = node.styles.text_valign;

        ctx.fillStyle = node.styles.foreground_color;
        if (node.styles.text_align === "center") {
          x += node._width * 0.5;
        }

        if (node.styles.text_valign === "middle") {
          y += (node._height * 0.5) + (node._text_m.actualBoundingBoxDescent * 0.35);
        }

        ctx.fillText(node.text, x, y);



      }
    });

    ge_cui.define_component("button", {
      init: function (node, parent, ui) {
        node.styles.text_align = "center";
        node.styles.text_valign = "middle";
        //node.styles.focus_rect = true;
        if (node.styles['border_size'] === undefined) {
          node.styles['border_size'] = 3;
        }

      },
      render: function (ctx, node, ui) {
        if (ui.mouse_down && node.uuid === ui.mouse_node_id) {
          node.styles.border_type = "inset";
          node.styles.padding_left = 2;
          node.styles.padding_top = 2;
        }
        else {
          node.styles.padding_left = 0;
          node.styles.padding_top = 0;
          node.styles.border_type = "outset";
        }
        ge_cui.components["text"].render(ctx, node, ui);
      }
    });

    ge_cui.define_component("hslider", {
      init: function (node, parent, ui) {
        node.value = node.value || 50;
        node.min = node.min || 0;
        node.max = node.max || 100;

        if (node.height === undefined) node.height = "20px";



        node.label_padding = node.label_padding || 0;
        node.children = [
          {
            on_init: function (node, parent) {

              parent.trail_width = parent._width - parent.label_padding - 10;

              node.parent.per = (node.parent.value - node.parent.min) / (node.parent.max - node.parent.min);
                            
              node._left = (parent.trail_width * parent.per);
            },
            width: "10px",
            styles: { background_color: "rgba(30,30,30,0.75)", position: "absolute", margin_top: 0, border_size: 1 },
            on_mouse_draging: function (node, dx, dy) {
              node._left += dx;
              if (node._left < 0) node._left = 0;
              if (node._left > node.parent.trail_width) node._left = node.parent.trail_width;
              node.parent.per = node._left / node.parent.trail_width;
              node.parent.value = node.parent.min + ((node.parent.max - node.parent.min) * node.parent.per);
            }
          }
        ];

      },

      render: function (ctx, node, ui) {
        ge_cui.components["block"].render(ctx, node, ui);
        ctx.fillStyle = "rgba(40,40,40,0.5)";

        ctx.fillRect(0, (node._height * 0.5) - 2, node.trail_width + 10, 6);
        if (node.label_padding > 0) {
          ctx.textBaseline = "middle";
          ctx.font = "12px " + node.styles.font;
          ctx.textAlign = "right";
          ctx.fillStyle = node.styles.foreground_color;
          ctx.fillText(parseInt(node.value), node._width - 2, node._height * 0.5);
        }

      }
    });

    ge_cui.define_component("checkbox", {
      init: function (node, parent, ui) {
        if (node.checked === undefined) node.checked = false;
        node.styles.text_valign = "middle";
        if (node.height === undefined) node.height = "20px";
        node.on_mouse_down = function () {
          this.checked = !this.checked;
          if (this.on_checked) this.on_checked(this.checked);
        }
      },
      render: function (ctx, node, ui) {

        node.styles.padding_left = node._height;
        ge_cui.components["text"].render(ctx, node, ui);
        ctx.strokeStyle = node.styles.foreground_color;
        ctx.strokeRect(4, 4, node._height - 8, node._height - 8);
        if (node.checked) {
          ctx.fillStyle = node.styles.foreground_color;
          ctx.fillRect(6, 6, node._height - 12, node._height - 12);
        }
      }
    });

    ge_cui.define_component("listbox", {
      init: function (node, parent, ui) {
        ge_cui.components["scroll-panel"].init(node, parent, ui);

        node.item_height = node.item_height || 20;
        node.item_count = 50;
        console.log("node", node);
      },
      render: function (ctx, node, ui) {
        ge_cui.components["scroll-panel"].render(ctx, node, ui);

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        var istart = 0, y = 0, item;
        ctx.fillStyle = node.styles.foreground_color;
        while (istart < node.items.length) {
          item = node.items[istart++];
          ctx.fillText(item, 2, y + node.styles.font_size);
          y += node.item_height;

          if (y > node._height) {
            break;
          }

        }



      }
    });


    ge_cui.define_component("label-field", {
      init: function (node, parent, ui) {
        node.height =node.height || "25px";
        node.field.width =node.field_size || "60%";
        node.field.styles = { margin_top: 2 };
        node.styles.border_size = 1;
        node.children = [
          {
            type: "text", width: "40%", styles: { text_valign: "middle", font_size: 10 }, text: node.label
          },
          node.field
        ];
      },
      render: function (ctx, node, ui) {
        ge_cui.components["block"].render(ctx, node, ui);
      }


    });

    return ge_cui;
  });



  ge.cui.mesh = ge.define(function (proto, _super) {

    function ge_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);



      this.width = def.width / 100;
      this.height = def.height / 100;

      this.mouse_controller = def.mouse_controller;

      
      this.geometry = ge.geometry.shapes.plane({ width: this.width, height: this.height });
      this.material = new ge.shading.material({
        ambient: [1, 1, 1],
        specular: [0, 0, 0],
        transparent:0.95
      });
      
      this.ui = new ge.cui(def);
      this.material.texture = ge.webgl.texture.from_size(def.width, def.height);
      this.material.texture.source = this.ui.canv;
      this.material.texture.needs_update = true;


      this.material.flags += 2048;

      this.material.texture.parameters[10242] = 33071;
      this.material.texture.parameters[10243] = 33071;
      this.material.texture.enable_linear_interpolation();

      this.ui.canv.ctx.transform(1, 0, 0, -1, 0, this.ui.canv.height);

      this.draw_offset = 0;
      this.draw_count = this.geometry.num_items;
      this.item_type = 4;
      this.flags = def.flags || 0;

      this.mesh_version = -1;
      this.imatrix_world = math.mat4();
      this.flags += 2048;

      this.mouse_int_point = math.vec3();

      this.on_document_update = new ge.event(this, [null]);
      
    }


    
    proto.on_render = function (camera) {
      if (this.ui.needs_update) {
        this.update_document();
        this.ui.needs_update = false;
      }
      if (this.is_picked) {


        camera.is_locked = true;  

        this.mouse_controller.set_mouse_ray();
        if (this.mouse_controller.mouse_delta !== 0) {
          if (math.utils.ray_plane_intersection(this.mouse_int_point, this.mouse_controller.mouse_ray_start, this.mouse_controller.mouse_ray_end, this.world_position, this.fw_vector)) {
            this.set_mouse_position(this.mouse_int_point, this.mouse_controller.mouse_buttons);    
          }
        }
        
        
        
        
        if (this.mouse_controller.mouse_buttons===0) {
          this.is_picked = false;
          camera.is_locked = false;
          if (this.ui.set_mouse_position(-10,-10, 0)) {
            this.update_document();
          }
        }
        
      }
      
    }

    proto.set_mouse_position = function (pos, mouse_button) {      
      if (this.mesh_version !== this.version) {
        this.mesh_version = this.version;
        math.mat4.inverse(this.imatrix_world, this.matrix_world);
      }
      math.vec3.transform_mat4(pos, pos, this.imatrix_world); 
   

      pos[0] = pos[0] / this.width;
      pos[1] = pos[1] / this.height;

      pos[0] += 0.5;
      pos[1] += 0.5;


      pos[1] = 1 - pos[1];
     

      if (this.ui.set_mouse_position(pos[0] * this.ui.canv.width, pos[1] * this.ui.canv.height, mouse_button)) {
        this.update_document();
      }


      

    };


    proto.update_bounds = function (mat, trans) {
      math.aabb.transform_mat4(this.bounds, this.geometry.aabb, mat);
      this.bounds_sphere = this.geometry.bounds_sphere * trans.scale_world[0];
    };

    proto.update_document = function () {
      this.ui.display_document();
      this.material.texture.source = this.ui.canv;
      this.material.texture.needs_update = true;
      this.on_document_update.params[0] = this.ui;
      this.on_document_update.trigger_params();
    };

    proto.set_document = function (doc) {
      this.ui.display_document(doc);
      this.material.texture.needs_update = true;
    }

    return ge_mesh;
  }, ge.renderable);

}})()(_FM["fin"],_FM["ge"],_FM["math"]);
(function() { return function renderer(fin,ge, math) {
  
  

  ge.renderer = ge.define(function (proto, _super) {

    var ge_renderer;

    var glsl = ge.webgl.shader.create_chunks_lib(`/*chunk-global-render-system-lighting*/

<?for(var i= 0;i<param('fws_num_lights');i++) {?>
	uniform mat4 u_light_material_rw<?=i?>;
	uniform mat4 u_light_matrix_rw<?=i?>;
<?}?>





float fws_distance_to_light;
float fws_lambertian;
float fws_specular;
float fws_attenuation;
float fws_intensity;
float fws_spot_light_calc;
float fws_spot_theta;
float fws_spot_light_status;

vec3 fws_total_light;
vec3 fws_light_value;

vec3 fws_lighting(
	mat4 fws_object_material,
	mat4 fws_light_material,
	vec3 fws_vertex_position, 
	vec3 fws_vertex_normal,
	vec3 fws_direction_to_eye,
	vec3 fws_direction_to_light, vec3 fws_direction_from_light) {

	fws_distance_to_light = length(fws_direction_to_light);

	

	fws_direction_to_light = normalize(fws_direction_to_light);
	fws_lambertian = max(dot(fws_direction_to_light, fws_vertex_normal), 0.0);


	fws_lambertian =dot(fws_direction_to_light, fws_vertex_normal);

	fws_intensity = fws_light_material[0].w;
	
	fws_attenuation = (fws_light_material[3].x + fws_light_material[3].y * fws_distance_to_light
		+ fws_light_material[3].z * (fws_distance_to_light * fws_distance_to_light)) + fws_light_material[3].w;

	fws_spot_light_status = step(0.000001, fws_light_material[1].w);	
	fws_spot_theta = dot(fws_direction_to_light, fws_direction_from_light);
	fws_spot_light_calc = clamp((fws_spot_theta - fws_light_material[2].w) / (fws_light_material[1].w - fws_light_material[2].w), 0.0, 1.0);
	fws_intensity *= (fws_spot_light_status * (step(fws_light_material[1].w, fws_spot_theta) * fws_spot_light_calc))
		+ abs(1.0 - fws_spot_light_status);

	
	fws_specular = pow(max(dot(normalize(fws_direction_to_light.xyz + fws_direction_to_eye), fws_vertex_normal), 0.0), fws_object_material[2].w) * fws_lambertian;
	fws_specular *= fws_intensity * step(0.0, fws_lambertian);
	
	


	fws_light_value = (fws_light_material[0].xyz * fws_object_material[0].xyz) +
		(fws_object_material[1].xyz * fws_lambertian * fws_light_material[1].xyz * fws_intensity) +
		(fws_object_material[2].xyz * fws_specular * fws_light_material[2].xyz);

		fws_light_value=max(fws_light_value,0.0);


		
	return (fws_light_value / fws_attenuation);


}


vec3 get_render_system_lighting(
	mat4 object_material_rw,
	vec3 fws_vertex,
	vec3 fws_normal,
	vec3 fws_direction_to_eye){

	fws_total_light=vec3(0.0);
	<?for (var i = 0;i < param('fws_num_lights');i++) {?>
			fws_total_light += fws_lighting(
				object_material_rw,
				u_light_material_rw<?=i?>,
				fws_vertex, fws_normal, fws_direction_to_eye,
				u_light_matrix_rw<?=i?>[3].xyz - fws_vertex,
			 u_light_matrix_rw<?=i?>[2].xyz);
	<?}?>

	return fws_total_light;
}




/*chunk-global-render-system-fog-effect*/

uniform vec3 u_fog_params_rw;
uniform vec4 u_fog_color_rw;
float get_linear_fog_factor(float eye_dist)
{  
   return clamp( (u_fog_params_rw.y - eye_dist) /
            (u_fog_params_rw.y - u_fog_params_rw.x ), 0.0, 1.0 );
}

vec4 mix_fog_color(vec4 frag_color){
	float fog_density=0.0005;
    const float LOG2=1.442695;
    float z=gl_FragCoord.z/gl_FragCoord.w;
    float fog_factor=exp2(-fog_density*fog_density*z*z*LOG2);
    fog_factor=clamp(fog_factor,0.0,1.0);
	return mix(u_fog_color_rw,frag_color,fog_factor);
}


/*chunk-textured-quad*/
attribute vec2 a_position_rw;
uniform vec4 u_pos_size;
const vec2 madd=vec2(0.5,0.5);
varying vec2 v_uv_rw;
void vertex()
{
gl_Position = vec4((a_position_rw.xy*u_pos_size.zw)+u_pos_size.xy,0.0,1.0);	
	v_uv_rw = a_position_rw.xy*madd+madd;  
	v_uv_rw.y=1.0-v_uv_rw.y;


}
<?=chunk('precision')?>
uniform sampler2D u_texture_rw;
varying vec2 v_uv_rw;
void fragment(void)
{	
gl_FragColor = texture2D(u_texture_rw, v_uv_rw);	
}

/*chunk-render-shadow-map*/

<?=chunk('precision')?>
uniform sampler2D u_texture_rw;
varying vec2 v_uv_rw;
void fragment(void) {			

	if(texture2D(u_texture_rw, v_uv_rw).a<0.02) discard;	
	gl_FragColor=vec4(0.85);	
}


/*chunk-receive-shadow*/
uniform mat4 u_light_camera_matrix_rw;
varying vec4 v_shadow_light_vertex_rw;

void vertex(){
	super_vertex();	
	v_shadow_light_vertex_rw = u_light_camera_matrix_rw * v_position_rw;
}


<?=chunk('precision')?>
<?=chunk('shadow-sampling')?>


varying vec3 v_normal_rw;
varying vec4 v_shadow_light_vertex_rw;
uniform sampler2D u_texture_rw;
uniform sampler2D u_shadow_map_rw;
uniform vec4 u_shadow_params_rw;
uniform vec4 u_shadow_attenuation_rw;

uniform vec3 u_light_pos_rw;
uniform vec3 u_light_dir_rw;

varying vec2 v_uv_rw;
varying vec4 v_position_rw;


float get_shadow_sample() {		



	float f=texture2D(u_texture_rw, v_uv_rw).a;		
	

	vec3 shadow_map_coords =v_shadow_light_vertex_rw.xyz/v_shadow_light_vertex_rw.w;
	f*=step(-(dot(v_normal_rw,normalize(u_light_pos_rw - v_position_rw.xyz))),0.0);

	shadow_map_coords.xyz = shadow_map_coords.xyz * 0.5 + 0.5;

	f*=step(shadow_map_coords.x,1.0)*step(shadow_map_coords.y,1.0)*step(shadow_map_coords.z,1.0);
	f*=step(0.0,shadow_map_coords.x)*step(0.0,shadow_map_coords.y)*step(0.0,shadow_map_coords.y);
	

	vec3 fws_direction_to_light=(u_light_pos_rw.xyz-v_position_rw.xyz);			

	
	float fws_distance_to_light=length(fws_direction_to_light)*0.99;
	fws_direction_to_light=normalize(fws_direction_to_light);

		
	float fws_spot_theta = dot(fws_direction_to_light,u_light_dir_rw);
	float fws_spot_light_calc = clamp((fws_spot_theta) / u_shadow_params_rw.w, 0.0, 1.0);
	
	f*=(step(1.0,fws_spot_light_calc));

	
	float fws_attenuation = (u_shadow_attenuation_rw.y * fws_distance_to_light
		+ u_shadow_attenuation_rw.z * (fws_distance_to_light * fws_distance_to_light));
		



	f/=(max(fws_attenuation,0.0));

	f*=(u_shadow_attenuation_rw.w/fws_distance_to_light);

	f*=(u_shadow_params_rw.x*(u_shadow_attenuation_rw.w/fws_distance_to_light));
	
	f=clamp(f,0.0,0.8);

	return  ((f-sample_shadow_map_pcf(u_shadow_map_rw, shadow_map_coords.xy,
	shadow_map_coords.z-u_shadow_params_rw.z ,vec2(u_shadow_params_rw.y))*f)
	*u_shadow_params_rw.x);

		
}


void fragment(void) {	
gl_FragColor = vec4((get_shadow_sample()));
}`);


    proto.gl_enable = function (state) {
      if (this.gl_states_flags[state] === 1) return (false);
      this.gl_states_flags[state] = 1;
      this.gl.enable(state);
      return (true);    
    };
    proto.gl_disable = function (state) {
      if (this.gl_states_flags[state] === 0) return (false);
      this.gl_states_flags[state] = 0;
      this.gl.disable(state);
      return (true);
    };

    proto.gl_blendFunc = function (func0, func1) {
      if (this.gl_states.blendFunc0 !== func0 || this.gl_states.blendFunc1 !== func1) {
        this.gl_states.blendFunc0 = func0;
        this.gl_states.blendFunc1 = func1;
        this.gl.blendFunc(func0, func1);
        return (true);
      }
      return (false);
    };
    proto.gl_blendEquation = function (param) {
      if (this.gl_states.blendEQuation !== param) {
        this.gl_states.blendEQuation = param;
        this.gl.blendEquation(param);
      }

    };
    proto.gl_depthMask = function (mask) {
      if (mask !== this.gl_states.depthMask) {
        this.gl_states.depthMask = mask;
        this.gl.depthMask(mask);
      }

    };
    proto.gl_depthFunc = function (func) {
      if (func !== this.gl_states.depthFunc) {
        this.gl_states.depthFunc = func;
        this.gl.depthFunc(func);
      }

    };
    proto.gl_cullFace = function (param) {
      if (param !== this.gl_states.cullFace) {
        this.gl_states.cullFace = param;
        this.gl.cullFace(param);
      }

    };
    proto.gl_bindFramebuffer2 = function (mode,param) {
      if (param !== this.gl_states.framebuffer) {
        this.gl_states.framebuffer = param;     
        this.gl.bindFramebuffer(mode,param);
        return true;
      }
      return false;

    };
    
    proto.set_canvas_size = function (width, height) {
      
      this.render_width = width * this.pixel_ratio;
      this.render_height = height * this.pixel_ratio;
      this.canvas.width = this.render_width;
      this.canvas.height = this.render_height;

      var i = 0;
      for (i = 0; i < this.post_processes.length; i++) {
        this.post_processes[i].resize(this.render_width, this.render_height);
      }

      for (i = 0; i < this.render_targets.length; i++) {
        this.render_targets[i].resize(this.render_width * this.render_targets[i].ratio, this.render_height * this.render_targets[i].ratio);

      }

      this.on_canvas_size(this.render_width, this.render_height);

    }
    proto.on_canvas_size = function (width,height) {   }


    proto.clear_screen = function () {
      this.gl.clear(16384 | 256);
      return (this);
    };

    proto.set_default_viewport = function () {
      if (this.default_render_target === null) {
        if (this.gl.bindFramebuffer(36160, this.frame_buffer_layer)) {

        }
        if (this.active_camera !== null) {
          this.gl.viewport(
            this.vp_left * this.render_width,
            this.vp_top * this.render_height,
            this.vp_width * this.render_width,
            this.vp_height * this.render_height);
        }

      }
      else {
        this.default_render_target.bind();
      }
      return (this)
    };


    proto.use_geometry = (function () {
      var return_value = 0, shader = null, i = 0, att = null, gl = null;
      var geometry_data = ge.geometry.geometry_data;
      proto.activate_geometry_index_buffer = (function () {
        var i, ii, a, b, c;
        function update_wireframe_indices(g) {
          if (g.index_buffer !== null) {
            if (!g.w_index_data) {
              g.w_index_data = geometry_data.create_index_data(g.index_data.length * 2);
            } else if (g.w_index_data.length < g.index_data.length * 2) {
              g.w_index_data = ggeometry_data.create_index_data(g.index_data.length * 2);
            }
            ii = 0;
            for (i = 0; i < g.index_data.length; i += 3) {
              a = g.index_data[i + 0];
              b = g.index_data[i + 1];
              c = g.index_data[i + 2];
              g.w_index_data[ii] = a;
              g.w_index_data[ii + 1] = b;
              g.w_index_data[ii + 2] = b;
              g.w_index_data[ii + 3] = c;
              g.w_index_data[ii + 4] = c;
              g.w_index_data[ii + 5] = a;
              ii += 6;
            }
          }
        }


        proto.reset_wireframe_index_buffer = function (gl, vert_count) {
          var indices = [];
          indices.length = 0;
          for (i = 0; i < (vert_count) - 1; i += 3) {
            a = i + 0;
            b = i + 1;
            c = i + 2;

            ii = indices.length;
            indices[ii] = a;
            indices[ii + 1] = b;
            indices[ii + 2] = b;
            indices[ii + 3] = c;
            indices[ii + 4] = c;
            indices[ii + 5] = a;



          }
          if (!this.wireframe_index_buffer) {
            this.wireframe_index_buffer = ge_renderer.gl_buffers.get(gl);
          }

          gl.bindBuffer(34963, this.wireframe_index_buffer);
          gl.bufferData(34963, geometry_data.create_index_data(indices), 35048);
          indices.length = 0;
        };

        proto.bind_default_wireframe_indices = function () {
          if (!this.wireframe_index_buffer) {
            this.reset_wireframe_index_buffer(gl, 100000 * 10);
            this.compile_attribute(this.default_color_attribute);
          }
          this.gl.bindBuffer(34963, this.wireframe_index_buffer);
        };

        return function (geo, is_wireframe) {
         
          if (geo.index_data) {
            var gl = this.gl;
            if (geo.index_needs_update) {
              if (geo.index_buffer === null) geo.index_buffer = ge_renderer.gl_buffers.get(gl);
              gl.bindBuffer(34963, geo.index_buffer);
              gl.bufferData(34963, geo.index_data, 35048);
            }


            if (is_wireframe) {
              if (geo.index_needs_update || !geo.w_index_data) {
                update_wireframe_indices(geo);
                if (!geo.w_index_buffer) geo.w_index_buffer = ge_renderer.gl_buffers.get(gl);
                gl.bindBuffer(34963, geo.w_index_buffer);
                gl.bufferData(34963, geo.w_index_data, 35048);
              }
              else
                gl.bindBuffer(34963, geo.w_index_buffer);
            }
            else {
              gl.bindBuffer(34963, geo.index_buffer);
            }
            geo.index_needs_update = false;
            return true;
          }
          else if (is_wireframe) {
            this.gl.bindBuffer(34963, this.wireframe_index_buffer);
            return true;
          }

          return false;

        }

      })();


      proto.update_geomerty_attribute = function (location, att) {
        
        if (att === null) {
          this.gl.disableVertexAttribArray(location);
          return (-1);
        }
        else {
          var gl = this.gl;
          var return_value = 0;
          gl.enableVertexAttribArray(location);

          if (att.needs_update === true) {
            if (att.buffer === null) {
              att.buffer = ge_renderer.gl_buffers.get(gl);
            }
            gl.bindBuffer(34962, att.buffer);
            gl.bufferData(34962, att.data, att.buffer_type, att.data_offset, att.data_length);
            return_value = 1;
            att.version += 1;
            att.needs_update = false;
          }
          else if (att.buffer !== null) {
            gl.bindBuffer(34962, att.buffer);
          }
          gl.vertexAttribPointer(location, att.item_size, att.data_type, false, att.stride, att.offset);
          gl.ANGLE_instanced_arrays.vertexAttribDivisorANGLE(location, att.divisor);




        }

        return return_value
      }

      proto.compile_geometry = (function () {
        proto.compile_attribute = function (att) {
          if (att.compiled) return;
          att.stride = att.stride || 0;
          att.offset = att.offset || 0;
          att.needs_update = att.needs_update || false;
          att.array = att.array || null;
          att.data_type = att.data_type || 5126;
          att.buffer_type = att.buffer_type || 35044;
          att.version = att.version || 1;

          att.divisor = att.divisor || 0;
          att.array = att.array || null;
          att.data_offset = att.data_offset || 0;
          att.data_length = att.data_length || 0;

          if (att.data) {
            att.data_length = att.data.length;
            if (att.buffer === null || att.buffer === undefined) att.buffer = ge_renderer.gl_buffers.get(this.gl);

            this.gl.bindBuffer(34962, att.buffer);
            this.gl.bufferData(34962, att.data, att.buffer_type, att.data_offset, att.data_length);
          }
          att.compiled = true;
          return (att);
        }

        proto.use_geometry_attribute = function (location, att) {
          this.compile_attribute(att);

          this.update_geomerty_attribute(location, att);
        };


        return function (gl, geo) {
          if (geo.compiled) return;

          if (!this.wireframe_index_buffer) {
            this.reset_wireframe_index_buffer(gl, 100000 * 10);
            this.compile_attribute(this.default_color_attribute);
          }



          for (aid in geo.attributes) {
            this.compile_attribute(geo.attributes[aid]);
          }

          geo.attributes.a_color_rw = geo.attributes.a_color_rw || this.default_color_attribute;

          if (geo.index_data) {

            if (geo.index_buffer === null) geo.index_buffer = ge_renderer.gl_buffers.get(gl);
            gl.bindBuffer(34963, geo.index_buffer);
            gl.bufferData(34963, geo.index_data, 35048);
          }
          geo.compiled = true;
        }
      })();


      return function (geo) {
        if (!geo.compiled) this.compile_geometry(this.gl, geo);

        shader = this.active_shader;

        if (shader.used_geo_id === geo.uuid) return;
        shader.used_geo_id = geo.uuid;
        

        for (i = 0; i < shader.all_attributes.length; i++) {
          att = shader.all_attributes[i];

          if (geo.attributes[att.name]) {          
            this.update_geomerty_attribute(att.location, geo.attributes[att.name]);
          }
          else {
            this.update_geomerty_attribute(att.location, null);
          }
        }


      }
    })();

    proto.use_shader = function (shader,skip_enter) {
      if (this.last_shader_id != shader.uuid) {

        if (this.active_shader !== null) {
           this.active_shader.exit(this);
        }
        if (!shader.compiled) {
          ge.webgl.shader.compile(this.gl, shader, this.shader_parameters);
        }
       
        this.gl.useProgram(shader.program);
         shader.enter(this);


        var uni;
        uni = shader.uniforms["u_fog_params_rw"];
      if (uni) {
        uni.params[uni.params_length] = this.fog_params;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_fog_color_rw"];
      if (uni) {
        uni.params[uni.params_length] = this.u_fog_color;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_timer_rw"];
      if (uni) {
        uni.params[uni.params_length] = this.timer;
        uni.func.apply(shader.gl, uni.params);
      }


        this.active_shader = shader;
        this.active_shader.camera_version = -1;
        this.last_shader_id = shader.uuid;
        this.active_shader.used_geo_id = -100;

        return (true);
      }
      return (false);
    };

   

    var cube_map_texture_sequence = [
      34070, 34069,
      34072, 34071,
      34074, 34073
    ];
    proto.update_texture = function (tex) {
      var new_texture = false;
      var gl = this.gl;

      if (tex.gl_texture === null) {
        tex.gl_texture = ge_renderer.gl_textures.get(gl);
        new_texture = true;
      }



      gl.bindTexture(tex.target, tex.gl_texture);

      if (tex.target === 34067) {
        for (i = 0; i < tex.source.length; i++) {
          gl.texImage2D(cube_map_texture_sequence[i], 0, tex.format, tex.format, texture.format_type, tex.source[i]);
        }
      }
      else {

        if (tex.source !== null && (tex.source.src || tex.source.getContext)) {
          gl.texImage2D(tex.target, 0, tex.format, tex.format, tex.format_type, tex.source);                    
          
        }        
        else {          
          gl.texImage2D(tex.target, 0, tex.format, tex.width, tex.height, 0, tex.format, tex.format_type, tex.source);
        }
      }
      
      if (new_texture) {

      }
      for (p in tex.parameters) {
        gl.texParameteri(tex.target, p, tex.parameters[p]);
      }

      if (tex.generate_mipmap) {
        gl.generateMipmap(tex.target);
      }
      gl.bindTexture(tex.target, null);
      tex.needs_update = false;
      tex.free_source();
      return tex;
    }

    proto.use_texture = function (texture, slot) {
      if (texture === null) {
        this.use_texture(this.default_texture, slot);
        return;
      }
      else {
        if (texture.needs_update) {
          this.update_texture(texture);
        }
        if (texture.gl_texture === null) {
          this.use_texture(this.default_texture, slot);
          return;
        }

      }

      texture.last_used_time = this.timer;
      if (this.texture_slots[slot] !== texture.uuid) {
        this.texture_slots[slot] = texture.uuid;
        this.gl.activeTexture(33984 + slot);
        this.gl.bindTexture(texture.target, texture.gl_texture);
      }

    };

    proto.use_direct_texture = function (texture, slot) {
      this.gl.activeTexture(33984 + slot);
      this.gl.bindTexture(texture.target, texture.gl_texture);
    };
    proto.draw_textured_quad = (function () {
      var att = {
        item_size: 2, data: new Float32Array([
          -1, -1,
          1, -1,
          1, 1,

          -1, -1,
          1, 1,
          -1, 1
        ])
      }
      var shdr = ge.webgl.shader.parse(glsl["textured-quad"]);
      var u_pos_size = math.vec4();
      return function (texture, left, top, width, height) {
        u_pos_size[0] = left;
        u_pos_size[1] = top;
        u_pos_size[2] = width;
        u_pos_size[3] = height;
        this.use_geometry_attribute(0, att);
        this.use_shader(shdr);
        shdr.set_uniform("u_pos_size", u_pos_size);
        this.gl_disable(2929);
        //this.gl_depthFunc(515);
       // this.gl_depthMask(false);
        this.gl_disable(2884);
        this.use_texture(texture, 0);
        this.gl.drawArrays(4, 0, 6);
       // this.gl_depthMask(true);

      }
    })();
    proto.draw_full_quad = function () {
      this.gl.bindBuffer(34962, this.full_quad);
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 2, 5126, false, 0, 0);
      this.gl.drawArrays(4, 0, 6);
    };

    

    proto.apply_post_processes = (function () {




      return function () {
        
        this.post_process_input = this.default_render_target.color_texture;
        this.post_target = this.default_render_target.swap;



        var i1 = 0;
        this.gl_disable(2929);
        
        for (var i0 = 0; i0 < this.post_processes.length; i0++) {
          post_process = this.post_processes[i0];
          if (post_process.enabled) {
            
            if (i1 % 2 === 0) {
              post_process.apply(this, this.post_process_input, this.post_target);
              this.post_process_input = this.post_target.color_texture;
              this.post_target = this.post_target.swap;
            }
            else {              
              post_process.apply(this, this.post_process_input, this.post_target);
              this.post_process_input = this.post_target.color_texture;
              this.post_target = this.post_target.swap;
            }
            i1++;
          }
        }
        


        if (this.output_to_screen) {
          this.render_target_id = -1;
          this.gl.bindFramebuffer(36160, null);
          this.use_shader(ge.effects.post_process.shader);


          this.gl.viewport(this.render_width * this.vp_left, this.render_height * this.vp_top,
            this.render_width * this.vp_width, this.render_height * this.vp_height);


        
          this.use_direct_texture(this.post_process_input, 0);
          this.draw_full_quad();
          this.has_error = this.gl.getError();
          if (this.has_error !== this.gl.NO_ERROR) {
            console.error(this.has_error);

          }

        }


        this.gl_enable(2929);
      }
    })();


    // shadow mapping ////
    proto.render_light_shadows = (function () {

      var shadow_maps = {}, shadow_map = null;
      function get_shadow_map(renderer, size) {
        shadow_map = shadow_maps[size];
        if (!shadow_map) {
          shadow_map = new ge.webgl.render_target(renderer, size, size);
          shadow_map.attach_color();
          shadow_map.attach_depth();
          shadow_maps[size] = shadow_map;
        }
        return shadow_map;
      }
      

      

      



      var qa = math.quat(), u_shadow_params_rw = math.vec4(), u_light_pos_rw = math.vec3(), u_light_dir_rw = math.vec3(), u_shadow_attenuation_rw = math.vec4();
      var cast_count = 0, total_shadow_casters = 0;
      var S5$qX,S5$qY,S5$qZ,S5$qW,S5$dqX,S5$dqY,S5$dqZ,S5$qLen,S5$quat1;
      var S3$a00,S3$a01,S3$a02,S3$mat1,S3$a03,S3$a05,S3$a06,S3$a07,S3$b00,S3$b01,S3$b02,S3$b03,S3$b04,S3$b05,S3$b06,S3$b07,S3$b08,S3$vec1,S3$mat2,S3$a10,S3$a11,S3$a12,S3$a13,S3$a20,S3$a21,S3$a22,S3$a23,S3$a30,S3$a31,S3$a32,S3$a33,S3$det,S3$b09,S3$b10,S3$b11,S3$mat3;

      return function (light, camera, opuque_meshes, transparent_meshes) {


      // get shadow map based on shadow map size in light
        shadow_map = get_shadow_map(this, light.shadow_map_size);

        var mesh, light_camera = null, mi = 0, shader, uni, renderer = this, d = 0, gl = this.gl, update_light_camera_matrices = false;


        // create light camera 
        if (!light.camera) {
          light.camera = {
            view: math.mat4(),
            view_inverse: math.mat4(),
            projection: math.mat4(),
            view_projection: math.mat4(),
            light_version: -1,
            camera_version: -1,
            version: 0
          };

          // default directional light
          if (light.light_type === 0) {
            d = light.shadow_camera_distance * 2;
            S3$mat1 = light.camera.projection;

      S3$a00 = 1 / (-d - d);
      S3$a01 = 1 / (-d - d);
      S3$a02 = 1 / (-d * 0.75 - d * 5);
      S3$mat1[0] = -2 * S3$a00;
      S3$mat1[1] = 0; S3$mat1[2] = 0; S3$mat1[3] = 0; S3$mat1[4] = 0;
      S3$mat1[6] = 0; S3$mat1[7] = 0; S3$mat1[8] = 0; S3$mat1[9] = 0;
      S3$mat1[5] = -2 * S3$a01;
      S3$mat1[10] = 2 * S3$a02;
      S3$mat1[11] = 0;
      S3$mat1[12] = (-d + d) * S3$a00;
      S3$mat1[13] = (d + -d) * S3$a01;
      S3$mat1[14] = (d * 5 + -d * 0.75) * S3$a02;
      S3$mat1[15] = 1;

          }
          // point light (fake camera since actual point ligh shadows requires 4 cameras and render pass)
          else if (light.light_type === 1) {
            d = 150 * 0.017453292519943295;
            S3$mat1 = light.camera.projection;

      S3$a00 = 1.0 / Math.tan(d / 2);
      S3$mat1[0] = S3$a00 / 1;
      S3$mat1[1] = 0;
      S3$mat1[2] = 0;
      S3$mat1[3] = 0;
      S3$mat1[4] = 0;
      S3$mat1[5] = S3$a00;
      S3$mat1[6] = 0;
      S3$mat1[7] = 0;
      S3$mat1[8] = 0;
      S3$mat1[9] = 0;
      S3$mat1[11] = -1;
      S3$mat1[12] = 0;
      S3$mat1[13] = 0;
      S3$mat1[15] = 0;
      if (light.range * 8 != null && light.range * 8 !== Infinity) {
        S3$a00 = 1 / (0.5 - light.range * 8);
        S3$mat1[10] = (light.range * 8 + 0.5) * S3$a00;
        S3$mat1[14] = (2 * light.range * 8 * 0.5) * S3$a00;
      } else {
        S3$mat1[10] = -1;
        S3$mat1[14] = -2 * 0.5;
      }
            d = -90 * 0.017453292519943295;
            S5$quat1 = qa;

      
      S5$qX = Math.sin(d * 0.5); S5$qY = Math.sin(0 * 0.5); S5$qZ = Math.sin(0 * 0.5);
      S5$dqX = Math.cos(d * 0.5); S5$dqY = Math.cos(0 * 0.5); S5$dqZ = Math.cos(0 * 0.5);



      S5$quat1[0] = S5$qX * S5$dqY * S5$dqZ - S5$dqX * S5$qY * S5$qZ;
      S5$quat1[1] = S5$dqX * S5$qY * S5$dqZ + S5$qX * S5$dqY * S5$qZ;
      S5$quat1[2] = S5$dqX * S5$dqY * S5$qZ - S5$qX * S5$qY * S5$dqZ;
      S5$quat1[3] = S5$dqX * S5$dqY * S5$dqZ + S5$qX * S5$qY * S5$qZ;


      S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
      S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;

      if (S5$qLen > 0) {
        S5$qLen = 1 / Math.sqrt(S5$qLen);
      }

      S5$quat1[0] = S5$qX * S5$qLen;
      S5$quat1[1] = S5$qY * S5$qLen;
      S5$quat1[2] = S5$qZ * S5$qLen;
      S5$quat1[3] = S5$qW * S5$qLen;
            S3$mat1 = light.camera.view;
      S3$vec1 = qa;

      S3$a00 = S3$vec1[0]; S3$a01 = S3$vec1[1]; S3$a02 = S3$vec1[2]; S3$a03 = S3$vec1[3];
      S3$a05 = S3$a00 + S3$a00;
      S3$a06 = S3$a01 + S3$a01;
      S3$a07 = S3$a02 + S3$a02;

      S3$b00 = S3$a00 * S3$a05;
      S3$b01 = S3$a00 * S3$a06;
      S3$b02 = S3$a00 * S3$a07;
      S3$b03 = S3$a01 * S3$a06;
      S3$b04 = S3$a01 * S3$a07;
      S3$b05 = S3$a02 * S3$a07;
      S3$b06 = S3$a03 * S3$a05;
      S3$b07 = S3$a03 * S3$a06;
      S3$b08 = S3$a03 * S3$a07;


      S3$mat1[0] = (1 - (S3$b03 + S3$b05));
      S3$mat1[1] = (S3$b01 + S3$b08);
      S3$mat1[2] = (S3$b02 - S3$b07);
      S3$mat1[3] = 0;
      S3$mat1[4] = (S3$b01 - S3$b08);
      S3$mat1[5] = (1 - (S3$b00 + S3$b05));
      S3$mat1[6] = (S3$b04 + S3$b06);
      S3$mat1[7] = 0;
      S3$mat1[8] = (S3$b02 + S3$b07);
      S3$mat1[9] = (S3$b04 - S3$b06);
      S3$mat1[10] = (1 - (S3$b00 + S3$b03));
      S3$mat1[11] = 0;

          }
          // spot light
          else if (light.light_type === 2) {

            S3$mat1 = light.camera.projection;

      S3$a00 = 1.0 / Math.tan(light.view_angle / 2);
      S3$mat1[0] = S3$a00 / 1;
      S3$mat1[1] = 0;
      S3$mat1[2] = 0;
      S3$mat1[3] = 0;
      S3$mat1[4] = 0;
      S3$mat1[5] = S3$a00;
      S3$mat1[6] = 0;
      S3$mat1[7] = 0;
      S3$mat1[8] = 0;
      S3$mat1[9] = 0;
      S3$mat1[11] = -1;
      S3$mat1[12] = 0;
      S3$mat1[13] = 0;
      S3$mat1[15] = 0;
      if (light.range * 4 != null && light.range * 4 !== Infinity) {
        S3$a00 = 1 / (0.1 - light.range * 4);
        S3$mat1[10] = (light.range * 4 + 0.1) * S3$a00;
        S3$mat1[14] = (2 * light.range * 4 * 0.1) * S3$a00;
      } else {
        S3$mat1[10] = -1;
        S3$mat1[14] = -2 * 0.1;
      }
          }
          light.camera.world_position = new Float32Array(light.camera.view.buffer, (12 * 4), 3);


        }

        light_camera = light.camera;


        // check light is moved then light camera needs to be updated
        if (light_camera.light_version !== light.version || update_light_camera_matrices) {
          if (light.light_type === 1) { // point light only set position
            light_camera.view[12] = light.world_position[0];
            light_camera.view[13] = light.world_position[1];
            light_camera.view[14] = light.world_position[2];
          }
          else {
            S3$mat1 = light_camera.view;
      S3$mat2 = light.matrix_world;

      S3$mat1[0] = S3$mat2[0];
      S3$mat1[1] = S3$mat2[1];
      S3$mat1[2] = S3$mat2[2];
      S3$mat1[3] = S3$mat2[3];
      S3$mat1[4] = S3$mat2[4];
      S3$mat1[5] = S3$mat2[5];
      S3$mat1[6] = S3$mat2[6];
      S3$mat1[7] = S3$mat2[7];
      S3$mat1[8] = S3$mat2[8];
      S3$mat1[9] = S3$mat2[9];
      S3$mat1[10] = S3$mat2[10];
      S3$mat1[11] = S3$mat2[11];
      S3$mat1[12] = S3$mat2[12];
      S3$mat1[13] = S3$mat2[13];
      S3$mat1[14] = S3$mat2[14];
      S3$mat1[15] = S3$mat2[15];
          }
          update_light_camera_matrices = true;
        }

        ///light moves or viewer camera updated
        if (light_camera.camera_version !== camera.version || update_light_camera_matrices) {
          if (light.light_type === 0) {
            d = -light.shadow_camera_distance;
            light_camera.world_position[0] = (camera.fw_vector[0] * d) + camera.world_position[0];
            light_camera.world_position[1] = (camera.fw_vector[1] * d) + camera.world_position[1];
            light_camera.world_position[2] = (camera.fw_vector[2] * d) + camera.world_position[2];
          }

          update_light_camera_matrices = true;
        }

        // if light view camera need updates
        if (update_light_camera_matrices) {

          S3$mat1 = light_camera.view_inverse;
      S3$mat2 = light_camera.view;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$a00 * S3$a11 - S3$a01 * S3$a10;
      S3$b01 = S3$a00 * S3$a12 - S3$a02 * S3$a10;
      S3$b02 = S3$a00 * S3$a13 - S3$a03 * S3$a10;
      S3$b03 = S3$a01 * S3$a12 - S3$a02 * S3$a11;
      S3$b04 = S3$a01 * S3$a13 - S3$a03 * S3$a11;
      S3$b05 = S3$a02 * S3$a13 - S3$a03 * S3$a12;
      S3$b06 = S3$a20 * S3$a31 - S3$a21 * S3$a30;
      S3$b07 = S3$a20 * S3$a32 - S3$a22 * S3$a30;
      S3$b08 = S3$a20 * S3$a33 - S3$a23 * S3$a30;
      S3$b09 = S3$a21 * S3$a32 - S3$a22 * S3$a31;
      S3$b10 = S3$a21 * S3$a33 - S3$a23 * S3$a31;
      S3$b11 = S3$a22 * S3$a33 - S3$a23 * S3$a32;

      S3$det = S3$b00 * S3$b11 - S3$b01 * S3$b10 + S3$b02 * S3$b09 + S3$b03 * S3$b08 - S3$b04 * S3$b07 + S3$b05 * S3$b06;

      if (S3$det) {
        S3$det = 1.0 / S3$det;

        S3$mat1[0] = (S3$a11 * S3$b11 - S3$a12 * S3$b10 + S3$a13 * S3$b09) * S3$det;
        S3$mat1[1] = (S3$a02 * S3$b10 - S3$a01 * S3$b11 - S3$a03 * S3$b09) * S3$det;
        S3$mat1[2] = (S3$a31 * S3$b05 - S3$a32 * S3$b04 + S3$a33 * S3$b03) * S3$det;
        S3$mat1[3] = (S3$a22 * S3$b04 - S3$a21 * S3$b05 - S3$a23 * S3$b03) * S3$det;
        S3$mat1[4] = (S3$a12 * S3$b08 - S3$a10 * S3$b11 - S3$a13 * S3$b07) * S3$det;
        S3$mat1[5] = (S3$a00 * S3$b11 - S3$a02 * S3$b08 + S3$a03 * S3$b07) * S3$det;
        S3$mat1[6] = (S3$a32 * S3$b02 - S3$a30 * S3$b05 - S3$a33 * S3$b01) * S3$det;
        S3$mat1[7] = (S3$a20 * S3$b05 - S3$a22 * S3$b02 + S3$a23 * S3$b01) * S3$det;
        S3$mat1[8] = (S3$a10 * S3$b10 - S3$a11 * S3$b08 + S3$a13 * S3$b06) * S3$det;
        S3$mat1[9] = (S3$a01 * S3$b08 - S3$a00 * S3$b10 - S3$a03 * S3$b06) * S3$det;
        S3$mat1[10] = (S3$a30 * S3$b04 - S3$a31 * S3$b02 + S3$a33 * S3$b00) * S3$det;
        S3$mat1[11] = (S3$a21 * S3$b02 - S3$a20 * S3$b04 - S3$a23 * S3$b00) * S3$det;
        S3$mat1[12] = (S3$a11 * S3$b07 - S3$a10 * S3$b09 - S3$a12 * S3$b06) * S3$det;
        S3$mat1[13] = (S3$a00 * S3$b09 - S3$a01 * S3$b07 + S3$a02 * S3$b06) * S3$det;
        S3$mat1[14] = (S3$a31 * S3$b01 - S3$a30 * S3$b03 - S3$a32 * S3$b00) * S3$det;
        S3$mat1[15] = (S3$a20 * S3$b03 - S3$a21 * S3$b01 + S3$a22 * S3$b00) * S3$det;
      }
          S3$mat1 = light_camera.view_projection;
      S3$mat2 = light_camera.projection;
      S3$mat3 = light_camera.view_inverse;


      S3$a00 = S3$mat2[0]; S3$a01 = S3$mat2[1]; S3$a02 = S3$mat2[2]; S3$a03 = S3$mat2[3];
      S3$a10 = S3$mat2[4]; S3$a11 = S3$mat2[5]; S3$a12 = S3$mat2[6]; S3$a13 = S3$mat2[7];
      S3$a20 = S3$mat2[8]; S3$a21 = S3$mat2[9]; S3$a22 = S3$mat2[10]; S3$a23 = S3$mat2[11];
      S3$a30 = S3$mat2[12]; S3$a31 = S3$mat2[13]; S3$a32 = S3$mat2[14]; S3$a33 = S3$mat2[15];


      S3$b00 = S3$mat3[0]; S3$b01 = S3$mat3[1]; S3$b02 = S3$mat3[2]; S3$b03 = S3$mat3[3];
      S3$mat1[0] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[1] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[2] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[3] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[4]; S3$b01 = S3$mat3[5]; S3$b02 = S3$mat3[6]; S3$b03 = S3$mat3[7];
      S3$mat1[4] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[5] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[6] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[7] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[8]; S3$b01 = S3$mat3[9]; S3$b02 = S3$mat3[10]; S3$b03 = S3$mat3[11];
      S3$mat1[8] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[9] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[10] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[11] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

      S3$b00 = S3$mat3[12]; S3$b01 = S3$mat3[13]; S3$b02 = S3$mat3[14]; S3$b03 = S3$mat3[15];
      S3$mat1[12] = S3$b00 * S3$a00 + S3$b01 * S3$a10 + S3$b02 * S3$a20 + S3$b03 * S3$a30;
      S3$mat1[13] = S3$b00 * S3$a01 + S3$b01 * S3$a11 + S3$b02 * S3$a21 + S3$b03 * S3$a31;
      S3$mat1[14] = S3$b00 * S3$a02 + S3$b01 * S3$a12 + S3$b02 * S3$a22 + S3$b03 * S3$a32;
      S3$mat1[15] = S3$b00 * S3$a03 + S3$b01 * S3$a13 + S3$b02 * S3$a23 + S3$b03 * S3$a33;

        }


        light_camera.camera_version = camera.version;
        light_camera.light_version = light.version;
        light_camera.version = camera.version + light.version;

        // bind shadow map
        shadow_map.bind();


        

        //cull front faces for better shadow rendering so only back faces are rendered
        this.gl_cullFace(1028);

        // render all the opuque shadow casters
        cast_count = 0;
        for (mi = 0; mi < opuque_meshes.length; mi++) {
          mesh = opuque_meshes[mi];
          if ((mesh.material.flags & 16) !== 0) {

            if (light.light_type > 0) {
              if (math.vec3.calc_distance(
                light_camera.view[12],
                light_camera.view[13],
                light_camera.view[14],
                mesh.world_position[0],
                mesh.world_position[1],
                mesh.world_position[2]
              ) - mesh.bounds_sphere > light.range * 3) {
                continue
              }
            }


            cast_count++;
            

            
            // if shadow casting shader is not created , extend it from mesh material shader and create it
            
            shader = mesh.material.shader;
            if (light.light_type > -1) {
              if (!shader.default_shadow_map) {
                shader.default_shadow_map = shader.extend(glsl['render-shadow-map'], { fragment: false });
                shader.default_shadow_map.shadow_shader = true;               
              }
              shader = shader.default_shadow_map;
            }

            if (renderer.use_shader(shader)) {
              uni = shader.uniforms["u_view_projection_rw"]; uni.params[uni.params_length] = light_camera.view_projection; uni.func.apply(shader.gl, uni.params);
            }           

            uni = shader.uniforms["u_model_rw"]; uni.params[uni.params_length] = mesh.matrix_world; uni.func.apply(shader.gl, uni.params);
            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
          }
        }


        total_shadow_casters = cast_count;


        if (transparent_meshes.length > 0) {
          this.gl_enable(3042);
          this.gl_blendFunc(770, 771);

          // render all the  transparent shadow casters

          cast_count = 0;
        for (mi = 0; mi < transparent_meshes.length; mi++) {
          mesh = transparent_meshes[mi];
          if ((mesh.material.flags & 16) !== 0) {

            if (light.light_type > 0) {
              if (math.vec3.calc_distance(
                light_camera.view[12],
                light_camera.view[13],
                light_camera.view[14],
                mesh.world_position[0],
                mesh.world_position[1],
                mesh.world_position[2]
              ) - mesh.bounds_sphere > light.range * 3) {
                continue
              }
            }


            cast_count++;
            

            
            // if shadow casting shader is not created , extend it from mesh material shader and create it
            
            shader = mesh.material.shader;
            if (light.light_type > -1) {
              if (!shader.default_shadow_map) {
                shader.default_shadow_map = shader.extend(glsl['render-shadow-map'], { fragment: false });
                shader.default_shadow_map.shadow_shader = true;               
              }
              shader = shader.default_shadow_map;
            }

            if (renderer.use_shader(shader)) {
              uni = shader.uniforms["u_view_projection_rw"]; uni.params[uni.params_length] = light_camera.view_projection; uni.func.apply(shader.gl, uni.params);
            }           

            uni = shader.uniforms["u_model_rw"]; uni.params[uni.params_length] = mesh.matrix_world; uni.func.apply(shader.gl, uni.params);
            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
          }
        }
          total_shadow_casters += cast_count;

        }


        u_shadow_params_rw[0] = light.shadow_intensity;
        u_shadow_params_rw[1] = 1 / light.shadow_map_size;
        u_shadow_params_rw[2] = light.shadow_bias;

        u_light_dir_rw[0] = light.matrix_world[8];
        u_light_dir_rw[1] = light.matrix_world[9];
        u_light_dir_rw[2] = light.matrix_world[10];


        // light camera view angle  to clamp shadow
        u_shadow_params_rw[3] = Math.cos(light.view_angle * 0.5);


        if (light.light_type === 0) {
          u_light_pos_rw[0] = u_light_dir_rw[0] * light.range;
          u_light_pos_rw[1] = u_light_dir_rw[1] * light.range;
          u_light_pos_rw[2] = u_light_dir_rw[2] * light.range;
        }
        else {

          u_light_pos_rw[0] = light.world_position[0]; u_light_pos_rw[1] = light.world_position[1]; u_light_pos_rw[2] = light.world_position[2];
        }


        this.gl_cullFace(1029);


        this.set_default_viewport();

        if (total_shadow_casters > 0) {

          // if there are any shadow casters then render shadow receivers 

          this.receive_shadow_count = 0;

          if (light.light_type === 1) {
            u_shadow_attenuation_rw[0] = 0;
            u_shadow_attenuation_rw[1] = (
              light.attenuation[0]
              + light.attenuation[1]

            ) * 2;
            u_shadow_attenuation_rw[2] = light.attenuation[2] * 2;
            u_shadow_attenuation_rw[3] = light.range * 0.95;
          }
          else if (light.light_type === 2) {
            u_shadow_attenuation_rw[0] = 0;
            u_shadow_attenuation_rw[1] = (
              light.attenuation[1]

            ) * 0.75;
            u_shadow_attenuation_rw[2] = light.attenuation[2] * 0.5;
            u_shadow_attenuation_rw[3] = light.range;

            u_shadow_attenuation_rw[0] = 1;
            u_shadow_attenuation_rw[1] = 0;
            u_shadow_attenuation_rw[2] = 0;
            u_shadow_attenuation_rw[3] = light.range;

          }
          else {

            // u_shadow_params_rw[0] = light.shadow_intensity * (light.range * 0.5);
            u_shadow_attenuation_rw[0] = 1;
            u_shadow_attenuation_rw[1] = 0;
            u_shadow_attenuation_rw[2] = 0;
            u_shadow_attenuation_rw[3] = light.range;

          }




          
          //enable forward rendering
      renderer.gl_blendFunc(1, 1);
      if (!renderer.fw_rendering_mode) {
        renderer.gl_enable(3042);
        renderer.gl_depthMask(false);
        renderer.gl_depthFunc(514);
        renderer.fw_rendering_mode = true;
      }

          this.gl_blendEquation(32779);
          this.use_direct_texture(shadow_map.color_texture, 0);
          this.use_direct_texture(shadow_map.depth_texture, 4);

          // render all the opuque shadow receivers
          for (mi = 0; mi < opuque_meshes.length; mi++) {
          mesh = opuque_meshes[mi];

          if ((mesh.material.flags & 32) !== 0) {


            if (light.light_type > 0) {
              if (math.vec3.calc_distance(
                light_camera.view[12],
                light_camera.view[13],
                light_camera.view[14],
                mesh.world_position[0],
                mesh.world_position[1],
                mesh.world_position[2]
              ) - mesh.bounds_sphere > light.range * 2) {
                continue
              }
            }
            renderer.receive_shadow_count++;


            // if shadow receiving  shader is not created , extend it from mesh material shader and create it
            shader = mesh.material.shader;
            if (light.light_type > -1) {
              if (!shader.default_shadow_receiver) {
                shader.default_shadow_receiver = shader.extend(glsl['receive-shadow'], { fragment: false });
                shader.default_shadow_receiver.shadow_shader = true;
              }
              shader = shader.default_shadow_receiver;
            }

           
            if (renderer.use_shader(shader)) {
              uni = shader.uniforms["u_view_projection_rw"]; uni.params[uni.params_length] = camera.view_projection; uni.func.apply(shader.gl, uni.params);
            };

            uni = shader.uniforms["u_shadow_map_rw"]; uni.params[uni.params_length] = 4; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_camera_matrix_rw"]; uni.params[uni.params_length] = light_camera.view_projection; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_pos_rw"]; uni.params[uni.params_length] = u_light_pos_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_dir_rw"]; uni.params[uni.params_length] = u_light_dir_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_shadow_params_rw"]; uni.params[uni.params_length] = u_shadow_params_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_shadow_attenuation_rw"]; uni.params[uni.params_length] = u_shadow_attenuation_rw; uni.func.apply(shader.gl, uni.params);


            uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }

            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);

          }


        }

          if (transparent_meshes.length > 0) {
            this.gl_depthFunc(513);
            // render all the transparent shadow receivers
            for (mi = 0; mi < transparent_meshes.length; mi++) {
          mesh = transparent_meshes[mi];

          if ((mesh.material.flags & 32) !== 0) {


            if (light.light_type > 0) {
              if (math.vec3.calc_distance(
                light_camera.view[12],
                light_camera.view[13],
                light_camera.view[14],
                mesh.world_position[0],
                mesh.world_position[1],
                mesh.world_position[2]
              ) - mesh.bounds_sphere > light.range * 2) {
                continue
              }
            }
            renderer.receive_shadow_count++;


            // if shadow receiving  shader is not created , extend it from mesh material shader and create it
            shader = mesh.material.shader;
            if (light.light_type > -1) {
              if (!shader.default_shadow_receiver) {
                shader.default_shadow_receiver = shader.extend(glsl['receive-shadow'], { fragment: false });
                shader.default_shadow_receiver.shadow_shader = true;
              }
              shader = shader.default_shadow_receiver;
            }

           
            if (renderer.use_shader(shader)) {
              uni = shader.uniforms["u_view_projection_rw"]; uni.params[uni.params_length] = camera.view_projection; uni.func.apply(shader.gl, uni.params);
            };

            uni = shader.uniforms["u_shadow_map_rw"]; uni.params[uni.params_length] = 4; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_camera_matrix_rw"]; uni.params[uni.params_length] = light_camera.view_projection; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_pos_rw"]; uni.params[uni.params_length] = u_light_pos_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_light_dir_rw"]; uni.params[uni.params_length] = u_light_dir_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_shadow_params_rw"]; uni.params[uni.params_length] = u_shadow_params_rw; uni.func.apply(shader.gl, uni.params);
            uni = shader.uniforms["u_shadow_attenuation_rw"]; uni.params[uni.params_length] = u_shadow_attenuation_rw; uni.func.apply(shader.gl, uni.params);


            uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }

            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);

          }


        }
          }
          this.gl_blendEquation(32774);
          //disable forward rendering
      if (renderer.fw_rendering_mode) {
        renderer.gl_disable(3042);
        renderer.gl_depthFunc(513);
        renderer.gl_depthMask(true);
        renderer.fw_rendering_mode = false;
      }
        }






        //this.draw_textured_quad(shadow_map.color_texture,0.65, 0.5, 0.25 / camera.aspect, 0.35);



      }
    })();



   

   



    


    


    

      

    
      
    

    


    


   



    var lights_eye_position = math.vec4(), dummy_light_m4 = math.mat4();
    dummy_light_m4.fill(0);
    dummy_light_m4[3] = 0; dummy_light_m4[15] = 0.5;


    var dummy_m4 = math.mat4();

    proto.render_single_mesh = function (camera, mesh) {

      if (renderer.use_shader(mesh.material.shader) || update_shading_lights) {
        shader = renderer.active_shader;
        update_shading_lights = false;
        if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }


      }
      uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }
      renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
    }

    proto.render_scene = function (camera, flat_meshes, opuque_meshes, transparent_meshes, lights) {
      if (this.has_error !== this.gl.NO_ERROR) { return; }

      this.last_shader_id = -1;
      this.render_target_id = -1;
      this.active_shader = null;
      this.texture_slots[0] = -1;
      this.texture_slots[1] = -1;
      this.texture_slots[2] = -1;
      this.flat_meshes = flat_meshes;
      this.opuque_meshes = opuque_meshes;
      this.transparent_meshes = transparent_meshes;

      this.active_camera = camera;

      var i, li = 0, si = 0, mesh, light, renderer, shader, uni, update_shading_lights = false, loop_count = 0, gl = this.gl;



      renderer = this;
      shader = renderer.active_shader;

      renderer.set_default_viewport();
      renderer.clear_screen();

      
      //disable forward rendering
      if (renderer.fw_rendering_mode) {
        renderer.gl_disable(3042);
        renderer.gl_depthFunc(513);
        renderer.gl_depthMask(true);
        renderer.fw_rendering_mode = false;
      }

      if (opuque_meshes.length > 0) {
        //begin render lighting
        this.light_pass_count = 0;this.lights_batch_size = 0;
for (li = 0; li < lights.length; li++) {
light = lights[li];
this.shading_lights[this.lights_batch_size++] = light;
update_shading_lights = this.lights_batch_size === this.fws_num_lights || li === lights.length - 1;
 if (update_shading_lights) {
        for (i = 0; i < opuque_meshes.length; i++) {
          mesh = opuque_meshes[i];
          if (renderer.light_pass_count >= mesh.material.light_pass_limit) continue;
          if (renderer.use_shader(mesh.material.shader) || update_shading_lights) {
            shader = renderer.active_shader;
            update_shading_lights = false;
            //update camera uniforms
            if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }

            loop_count = mesh.material.lights_count;
            total_lights = 0;

      if (loop_count === -1) loop_count = this.lights_batch_size;
      for (si = 0; si < loop_count; si++) {
        light = this.shading_lights[si];

        if (light != null) {
          if (light.light_type === 0) {
            lights_eye_position[0] = light.world_position[0]; lights_eye_position[1] = light.world_position[1]; lights_eye_position[2] = light.world_position[2];
            light.world_position[0] = light.matrix_world[8] * 99999; light.world_position[1] = light.matrix_world[9] * 99999; light.world_position[2] = light.matrix_world[10] * 99999;
            light.attenuation[3] = 1;
          }
          else {
            light.attenuation[3] = 0;
          }

          uni = shader.uniforms["u_light_material_rw" + si]; uni.params[uni.params_length] = light.light_material; uni.func.apply(shader.gl, uni.params);
          uni = shader.uniforms["u_light_matrix_rw" + si]; uni.params[uni.params_length] = light.matrix_world; uni.func.apply(shader.gl, uni.params);

          if (light.light_type === 0) {
            light.world_position[0] = lights_eye_position[0]; light.world_position[1] = lights_eye_position[1]; light.world_position[2] = lights_eye_position[2];
          }



        }



      }


      for (si = loop_count; si < this.fws_num_lights; si++) {
        uni = shader.uniforms["u_light_material_rw" + si];
      if (uni) {
        uni.params[uni.params_length] = dummy_light_m4;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_light_matrix_rw" + si];
      if (uni) {
        uni.params[uni.params_length] = dummy_m4;
        uni.func.apply(shader.gl, uni.params);
      }
      }

      lights_eye_position[0] = camera.world_position[0]; lights_eye_position[1] = camera.world_position[1]; lights_eye_position[2] = camera.world_position[2];


      lights_eye_position[3] = this.lights_batch_size;

      uni = shader.uniforms["u_eye_position_rw"];
      if (uni) {
        uni.params[uni.params_length] = lights_eye_position;
        uni.func.apply(shader.gl, uni.params);
      }
            
          }
          uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }
          renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
          
        }
        this.lights_batch_size = 0;this.light_pass_count++;
if (lights.length > this.fws_num_lights) {
//enable forward rendering
      this.gl_blendFunc(1, 1);
      if (!this.fw_rendering_mode) {
        this.gl_enable(3042);
        this.gl_depthMask(false);
        this.gl_depthFunc(514);
        this.fw_rendering_mode = true;
      }
}}}
        
      }


      //disable forward rendering
      if (renderer.fw_rendering_mode) {
        renderer.gl_disable(3042);
        renderer.gl_depthFunc(513);
        renderer.gl_depthMask(true);
        renderer.fw_rendering_mode = false;
      }
      // flat_meshes


      for (i = 0; i < flat_meshes.length; i++) {
        mesh = flat_meshes[i];
        if (renderer.use_shader(mesh.material.shader)) {          
          shader = renderer.active_shader;
          if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }
        }
        uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }
        renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);  
      }

      
      for (li = 0; li < lights.length; li++) {
        light = lights[li];
        if (light.cast_shadows) {
          this.render_light_shadows(light, camera, opuque_meshes, transparent_meshes);
        }
        this.texture_slots[0] = -1;


      }




     

      if (transparent_meshes.length > 0) {
        //disable forward rendering
      if (renderer.fw_rendering_mode) {
        renderer.gl_disable(3042);
        renderer.gl_depthFunc(513);
        renderer.gl_depthMask(true);
        renderer.fw_rendering_mode = false;
      }

        for (i = 0; i < transparent_meshes.length; i++) {
          mesh = transparent_meshes[i];

          if (mesh.material.flags & 4) {
            if (renderer.light_pass_count >= mesh.material.light_pass_limit) continue;
            this.light_pass_count = 0;this.lights_batch_size = 0;
for (li = 0; li < lights.length; li++) {
light = lights[li];
this.shading_lights[this.lights_batch_size++] = light;
update_shading_lights = this.lights_batch_size === this.fws_num_lights || li === lights.length - 1;
 if (update_shading_lights) {
            if (renderer.use_shader(mesh.material.shader) || update_shading_lights) {
              shader = renderer.active_shader;
              if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }
              uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }

              loop_count = mesh.material.lights_count;
              total_lights = 0;

      if (loop_count === -1) loop_count = this.lights_batch_size;
      for (si = 0; si < loop_count; si++) {
        light = this.shading_lights[si];

        if (light != null) {
          if (light.light_type === 0) {
            lights_eye_position[0] = light.world_position[0]; lights_eye_position[1] = light.world_position[1]; lights_eye_position[2] = light.world_position[2];
            light.world_position[0] = light.matrix_world[8] * 99999; light.world_position[1] = light.matrix_world[9] * 99999; light.world_position[2] = light.matrix_world[10] * 99999;
            light.attenuation[3] = 1;
          }
          else {
            light.attenuation[3] = 0;
          }

          uni = shader.uniforms["u_light_material_rw" + si]; uni.params[uni.params_length] = light.light_material; uni.func.apply(shader.gl, uni.params);
          uni = shader.uniforms["u_light_matrix_rw" + si]; uni.params[uni.params_length] = light.matrix_world; uni.func.apply(shader.gl, uni.params);

          if (light.light_type === 0) {
            light.world_position[0] = lights_eye_position[0]; light.world_position[1] = lights_eye_position[1]; light.world_position[2] = lights_eye_position[2];
          }



        }



      }


      for (si = loop_count; si < this.fws_num_lights; si++) {
        uni = shader.uniforms["u_light_material_rw" + si];
      if (uni) {
        uni.params[uni.params_length] = dummy_light_m4;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_light_matrix_rw" + si];
      if (uni) {
        uni.params[uni.params_length] = dummy_m4;
        uni.func.apply(shader.gl, uni.params);
      }
      }

      lights_eye_position[0] = camera.world_position[0]; lights_eye_position[1] = camera.world_position[1]; lights_eye_position[2] = camera.world_position[2];


      lights_eye_position[3] = this.lights_batch_size;

      uni = shader.uniforms["u_eye_position_rw"];
      if (uni) {
        uni.params[uni.params_length] = lights_eye_position;
        uni.func.apply(shader.gl, uni.params);
      }

              if (renderer.light_pass_count === 0) {
                renderer.gl_enable(3042);
                renderer.gl_blendFunc(770, 771);
                renderer.gl_cullFace(1028);
                renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
                renderer.gl_cullFace(1029);
                renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
              }
              else {
                renderer.gl_blendFunc(770, 1);
                renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
              }
            }
            this.lights_batch_size = 0;this.light_pass_count++;
if (lights.length > this.fws_num_lights) {
//enable forward rendering
      this.gl_blendFunc(1, 1);
      if (!this.fw_rendering_mode) {
        this.gl_enable(3042);
        this.gl_depthMask(false);
        this.gl_depthFunc(514);
        this.fw_rendering_mode = true;
      }
}}}

          }

          else {
            if (renderer.use_shader(mesh.material.shader)) {
              
            }
            shader = renderer.active_shader;
            if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }
            uni = shader.uniforms["u_model_rw"];
      if (uni) {
        uni.params[uni.params_length] = mesh.matrix_world;
        uni.func.apply(shader.gl, uni.params);
      }
            renderer.gl_enable(3042);
            renderer.gl_blendFunc(770, 771);
            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
          }


        }
      }

      



      //disable forward rendering
      //disable forward rendering
      if (renderer.fw_rendering_mode) {
        renderer.gl_disable(3042);
        renderer.gl_depthFunc(513);
        renderer.gl_depthMask(true);
        renderer.fw_rendering_mode = false;
      }
      renderer.set_default_viewport();
      if (this.active_shader !== null) {
        this.active_shader.exit(this);
      }

     

      if (this.default_render_target !== null) this.apply_post_processes();





    };

   
    ge_renderer=function (def) {
      def = def || {};
      
      var _canvas = def.canvas
      if (!_canvas) {
        _canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        _canvas.setAttribute("style", "position:absolute;width:100%;height:100%;left:0;top:0;box-sizing: border-box;");
       
      }

      this.priority = 5000;

      def = fin.merge_object(def, {
        alpha: false, depth: true, stencil: true,
        antialias: false, premultipliedAlpha: false,
        preserveDrawingBuffer: false, xrCompatible: true
      });
      var gl = def.context || _canvas.getContext('webgl', def );

      this.shader_parameters = {
        fws_num_lights: def.lights_count_per_pass || 4
      };

      if (gl === null) {
        if (_canvas.getContext('webgl') !== null) {
          throw new Error('Error creating WebGL context with your selected attributes.');
        } else {
          throw new Error('Error creating WebGL context.');
        }
      }

      this.pixel_ratio = def.pixel_ratio || window.devicePixelRatio;

      _canvas.addEventListener('webglcontextlost', function () {
        console.log('webglcontextlost', this);
      }, false);

      _canvas.addEventListener('webglcontextrestored', function () {
        console.log('webglcontextrestored', this);
      }, false);


      gl.OES_vertex_array_object = gl.getExtension("OES_vertex_array_object");
      gl.OES_standard_derivatives = gl.getExtension("OES_standard_derivatives");
      gl.WEBGL_depth_texture = gl.getExtension('WEBGL_depth_texture');
      gl.ANGLE_instanced_arrays = gl.getExtension('ANGLE_instanced_arrays');
      gl.OES_element_index_uint = gl.getExtension('OES_element_index_uint');
    
      this.gl_states = {
        depthMask: false, blendFunc0: -1, blendFunc1: -1, framebuffer: undefined,
      };
      this.gl_states_flags = new Uint8Array(1024 * 64);
      this.gl = gl;
      this.canvas = _canvas;

      
      this.render_target_id = 0;
      
      this.render_target1 = new ge.webgl.render_target(this, 10, 10);
      this.render_target1.attach_depth_buffer().attach_color();
      this.render_target1.clear_buffer = false;



      this.default_render_target = this.render_target1;


      this.render_target2 = new ge.webgl.render_target(this, 10, 10);
      this.render_target2.attach_depth_buffer(this.render_target1.depth_buffer).attach_color();
      this.render_target2.clear_buffer = false;




      this.render_target1.swap = this.render_target2;
      this.render_target2.swap = this.render_target1;

     // this.default_render_target = null;
      
      this.post_processes = [];
      this.render_targets = [
        this.render_target1,
        this.render_target2,
      ];




      this.texture_slots = [-1, -1, -1, -1, -1, -1 - 1, -1, -1, -1];
      this.texture_updates = [];
      this.default_texture = new ge.webgl.texture();
      this.default_texture.needs_update = true;
      this.update_texture(this.default_texture);


      this.gl_enable(2929);
      this.gl_cullFace(1029);
      this.gl_enable(2884);
      this.gl.clearColor(0, 0, 0, 1);


      this.full_quad = ge_renderer.gl_buffers.get(gl);
      gl.bindBuffer(34962, this.full_quad);
      gl.bufferData(34962, new Float32Array([
        -1, -1,
        1, -1,
        1, 1,
        -1, -1,
        1, 1,
        -1, 1,
      ]), 35044, 0, 12);


      this.fws_num_lights = this.shader_parameters.fws_num_lights;
      this.shading_lights = [];
      for (var i = 0; i < this.shader_parameters.fws_num_lights; i++) {
        this.shading_lights[i] = null;
      }


      this.has_error = 0;

      this.light_pass_count = 0;
      this.lights_batch_size = 0;
      this.active_camera = null;
      this.frame_buffer_layer = null;

      this.default_color_attribute = {
        name: "a_color_rw",
        item_size: 4,
        data: new Float32Array(7183056*2)
      };
      this.vp_left = 0;
      this.vp_top = 0;
      this.vp_width = 1;
      this.vp_height = 1;
      this.sbs_display = false;
      this.sbs_depth = 2;

      this.default_color_attribute.data.fill(1);
      this.is_renderer = true;
      this.active_camera = null;

      this.fog_params = math.vec3(0, 0, 0);
      this.fog_color = math.vec4(0.165, 0.165, 0.165, 0.001);

      this.timer = 0;

      this.output_to_screen = true;
      this.frame_eye_index = 0;
      this.render_width = this.canvas.width;
      this.render_height = this.canvas.height;


    }

    ge_renderer.gl_buffers = new fin.object_pooler(function (gl) {
      return gl.createBuffer();
    });
    ge_renderer.gl_textures = new fin.object_pooler(function (gl) {
      return gl.createTexture();
    });
    











    return ge_renderer;
    
  });



}})()(_FM["fin"],_FM["ge"],_FM["math"]);
(function() { return function terrain(ecs, ge, math) {

  ge.terrain = {};

  var WORKER_THREAD_MESSAGES = {
    REQUEST_REGION_MESH: 2000,
    REQUEST_REGION_QT: 3000,
    REQUEST_REGION_CQT: 3500,

  };

  ge.terrain.processor = ge.define(function (proto, _super) {

    proto.setup_mesh_processor = (function () {

      proto.regions_from_image_url = (function () {

        return function (url, xs, zs, divisor, ww, hh, scale) {
          var self = this;
          divisor = divisor || 1;
          ge.load_working_image_data(url, function (image_data, width, height) {
            var minh = 999999;
            var maxh = -999999, ht = 0;
            var data = []
            for (var i = 0; i < image_data.length / 4; i++) {
              ht = image_data[i * 4] / divisor;
              if (ht < minh) minh = ht;
              if (ht > maxh) maxh = ht;

              data[i] = ht;
            }
            size = maxh - minh;


            self.worker.postMessage([200, xs, zs, width, data, scale || 1]);
          }, ww, hh);
        }
      })();

      proto.regions_from_data = (function () {
        var i = 0;



        return function (data, xs, zs, width, scale, divisor) {
          if (divisor) {
            for (i = 0; i < data.length; i++) {
              data[i] *= divisor;
            }
          }
          this.worker.postMessage([200, xs, zs, width, data, scale]);
        }
      })();
      proto.update_terrain_parameters = function () {
        this.worker.postMessage([100, this.world_size, this.region_size, this.terrain_quality]);
        this.worker.postMessage([400,
          this.sun_direction[0] * this.world_size * this.region_size,
          this.sun_direction[1] * this.world_size * this.region_size,
          this.sun_direction[2] * this.world_size * this.region_size
        ]);
      };

      proto.generate_regions = function (settings, xs, zs, size, scale) {
        this.worker.postMessage([9999, settings, xs, zs, size, scale]);
      };



      return function () {
        var worker = ge.worker(
          function (thread) {
            var regions = {}, world_size, region_size, region_size1;
            var region_size2, terrain_quality = 1, region_size_scale, region_size_scale1;
            var reg_x, reg_z, reg, reg_key;

            console.log("regions", regions);

            regions.pool = [];
            regions.pool.free = function (reg) { this.push(reg); }
            regions.pool.get = function () {
              return this.length > 0 ? this.pop() : {
                HP: {}
              };
            }



            var PATCH_SIZE = 16, MIN_PATCH_SIZE = 2, MIN_FAN_DETAIL = 2, CQT_DETAIL = 0, ORIG_MIN_PATCH_SIZE = 0;;

            var WORKING_PATCH_SIZE = PATCH_SIZE, WORKING_MIN_PATCH_SIZE = MIN_PATCH_SIZE;

            var vkey, vindex_width = 1200;

            var vmap = new Uint8Array(0), vdata = new Float32Array(0);

            var vindex_width2 = vindex_width / 2;
            var check_vlevel_value = 0;
            function check_vlevel(x, z) {
              check_vlevel_value = vmap[(z + vindex_width2) * vindex_width + (x + vindex_width2)];
              return check_vlevel_value;
            };




            function set_vlevel(x, z, l) {
              vkey = (z + vindex_width2) * vindex_width + (x + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], l);
            }

            ;


            var time_start, rast_time;

            var output = new Float32Array(400000 * 6), oi = 0;

            var render_strips = (function () {
              var st = 0;
              return function (size) {
                for (st = 0; st < region_size; st += size * 2) {
                  set_vlevel(st, 0, size);
                  set_vlevel(st, region_size, size);
                  set_vlevel(0, st, size);
                  set_vlevel(region_size, st, size);
                }
              }
            })();

            var patches = {};

            var sun_x = 15000, sun_y = 5500, sun_z = 15000;
            thread[400] = function (op, _sun_x, _sun_y, _sun_z) {
              sun_x = _sun_x;
              sun_y = _sun_y;
              sun_z = _sun_z;
            };
            thread[100] = function (op, _world_size, _region_size, _terrain_quality) {
              world_size = _world_size;
              region_size = _region_size;
              region_size1 = region_size + 1;
              region_size2 = region_size * 0.5;
              terrain_quality = _terrain_quality;
              if (terrain_quality === 0) {
                PATCH_SIZE = 4;
                MIN_PATCH_SIZE = 1;
                MIN_DETAIL = 1;
                CQT_DETAIL = 4;
                MIN_FAN_DETAIL = 2;
              }
              else if (terrain_quality === 1) {
                PATCH_SIZE = 8;
                MIN_PATCH_SIZE = 2;
                CQT_DETAIL = 8;
                MIN_FAN_DETAIL = 2;
              }
              if (terrain_quality === 2) {
                PATCH_SIZE = 16;
                MIN_PATCH_SIZE = 4;
                CQT_DETAIL = 12;
                MIN_FAN_DETAIL = 2;
              }
              else if (terrain_quality === 3) {
                PATCH_SIZE = 32;
                MIN_PATCH_SIZE = 4;
                CQT_DETAIL = 9;
                MIN_FAN_DETAIL = 2;
              }
              else if (terrain_quality === 4) {
                PATCH_SIZE = 32;
                MIN_PATCH_SIZE = 8;
                CQT_DETAIL = 24;
                MIN_FAN_DETAIL = 4;
              }
              else if (terrain_quality === 5) {
                PATCH_SIZE = 32;
                MIN_PATCH_SIZE = 16;
                CQT_DETAIL = 32;
                MIN_FAN_DETAIL = 4;
              }

              else if (terrain_quality === 6) {
                PATCH_SIZE = 32;
                MIN_PATCH_SIZE = 16;
                CQT_DETAIL = 32;
                MIN_FAN_DETAIL = 8;
              }

              ORIG_MIN_PATCH_SIZE = MIN_PATCH_SIZE;

              var s = 1;
              while (s <= region_size) {
                patches[s] = { i: 0, list: [] };
                s = s * 2;
              }

              vindex_width = (region_size * 2) + 8;
              vindex_width2 = vindex_width / 2;

              vkey = vindex_width * vindex_width;
              if (vmap.length < vkey) {
                vmap = new Uint8Array(vkey)
                vdata = new Float32Array(vkey * 4);
              }



            };



            thread[200] = (function () {
              var tx, tz, i0, i1, i3, size;
              function adjust_data(data, data_size) {
                var new_data = new Float32Array((data_size + 1) * (data_size + 1));
                for (reg_z = 0; reg_z < data_size; reg_z++) {
                  for (reg_x = 0; reg_x < data_size; reg_x++) {
                    new_data[reg_z * (data_size + 1) + reg_x] = data[reg_z * data_size + reg_x];
                  }
                }
                for (reg_z = 0; reg_z < data_size; reg_z++) {
                  new_data[reg_z * (data_size + 1) + data_size] = data[reg_z * data_size + (data_size - 1)];
                }
                for (reg_x = 0; reg_x < data_size; reg_x++) {
                  new_data[data_size * (data_size + 1) + reg_x] = data[(data_size - 1) * data_size + reg_x];
                }

                new_data[data_size * (data_size + 1) + data_size] =
                  (data[(data_size - 1) * data_size + (data_size - 1)] +
                    data[(data_size - 1) * data_size + (data_size - 1)]) / 2;

                return new_data;
              }


              var build_region = (function () {
                return function (op, xs, zs, data_size, data, scale) {
                  data = adjust_data(data, data_size);
                  region_size_scale = region_size / scale;
                  region_size_scale1 = region_size_scale + 1;
                  size = Math.floor(data_size / region_size_scale);
                  data_size += 1;

                  for (reg_z = 0; reg_z < size; reg_z++) {
                    for (reg_x = 0; reg_x < size; reg_x++) {

                      reg_key = (reg_z + zs) * world_size + (reg_x + xs);
                      reg = regions[reg_key] || regions.pool.get();
                      reg.HP = {};
                      reg.QT = undefined;
                      reg.data = reg.data || new Float32Array(region_size_scale1 * region_size_scale1);
                      if (reg.size !== undefined) {
                        if (reg.size !== region_size_scale1) {
                          reg.data = new Float32Array(region_size_scale1 * region_size_scale1);
                        }

                      }


                      reg.minh = 999999;
                      reg.maxh = -999999;
                      reg.rx = (reg_x + xs);
                      reg.rz = (reg_z + zs);

                      reg.x = reg.rx * region_size;
                      reg.z = reg.rz * region_size;
                      reg.scale = scale;
                      reg.size = region_size_scale1;

                      i0 = (reg_x * region_size_scale);
                      for (tz = 0; tz < region_size_scale1; tz++) {
                        i1 = (((reg_z * region_size_scale) + tz) * (data_size)) + i0;
                        i3 = (tz * region_size_scale1);
                        for (tx = 0; tx < region_size_scale1; tx++) {
                          ht = data[i1 + tx] || 0;

                          if (ht < reg.minh) reg.minh = ht;
                          if (ht > reg.maxh) reg.maxh = ht;

                          reg.data[(i3 + tx)] = ht;
                        }
                      }
                      regions[reg_key] = reg;
                      reg.key = reg_key;
                      thread.postMessage([op, reg_key, reg.rx, reg.rz, reg.minh, reg.maxh]);



                    }
                  }
                  console.log((size * size) + ' regions loaded');
                }
              })();
              return build_region;
            })();

            var H = (function () {
              var z, x, ix1, iz1, ix2, iz2;
              var c1, c2, size, h1, h2, h3, h4, data, vk;


              return function (xp, zp) {
                if (reg.scale === 1) {
                  return reg.data[zp * region_size1 + xp];
                }


                vk = zp * region_size1 + xp;
                if (reg.HP[vk] !== undefined) {
                  return reg.HP[vk];
                }

                data = reg.data;
                size = reg.size;
                x = xp / reg.scale;
                z = zp / reg.scale;


                ix1 = (x < 0 ? 0 : x >= size ? size - 1 : x) | 0;
                iz1 = (z < 0 ? 0 : z >= size ? size - 1 : z) | 0;

                ix2 = ix1 === size - 1 ? ix1 : ix1 + 1;
                iz2 = iz1 === size - 1 ? iz1 : iz1 + 1;

                xp = x % 1;
                zp = z % 1;


                h1 = data[(ix1 + iz1 * size)];
                h2 = data[(ix2 + iz1 * size)];
                h3 = data[(ix1 + iz2 * size)];
                h4 = data[(ix2 + iz2 * size)];

                h1 = h1 * h1;
                h2 = h2 * h2;
                c1 = (h2 - h1) * xp + h1;
                c2 = (h4 * h4 - h4 * h3) * xp + h3 * h3;

                reg.HP[vk] = (Math.sqrt((c2 - c1) * zp + c1));


                return reg.HP[vk];
              }


            })();
            var HH = (function () {
              var _rx, _rz, v, temp_reg, rs;



              return function (x, z) {
                if (x > -1 && x < region_size1) {
                  if (z > -1 && z < region_size1) {
                    return H(x, z);
                  }
                }

                rs = region_size;
                _rx = 0; _rz = 0;
                if (x < 0) {
                  _rx = -1;
                  x = rs + x;
                }
                else if (x > rs) {
                  _rx = 1;
                  x = x % rs;
                }

                if (z < 0) {
                  _rz = -1;
                  z = rs + z;
                }
                else if (z > rs) {
                  _rz = 1;
                  z = z % rs;
                }

                reg_key = (reg.rz + _rz) * world_size + (reg.rx + _rx);
                temp_reg = reg;
                reg = regions[reg_key];
                if (reg) {
                  v = H(x, z);
                  reg = temp_reg;
                  return v;

                }
                reg = temp_reg;
                return 0;


              }
            })();


            var reg_data;
            var _fp, nx, ny, nz;


            var p, i = 0, x, z, j = 0, s = 1;
            var patch_index = 0;

        

            ;




            var draw_fan = (function () {

              var fi = 0, lfx, lfz, fx, fz;

              var fan = [
                -1, 1, -0.75, 1, -0.5, 1, -0.25, 1, 0, 1, 0.25, 1, 0.5, 1, 0.75, 1, 1, 1,
                1, 0.75, 1, 0.5, 1, 0.25, 1, 0, 1, -0.25, 1, -0.5, 1, -0.75, 1, -1,
                0.75, -1, 0.5, -1, 0.25, -1, 0, -1, -0.25, -1, -0.5, -1, -0.75, -1, -1, -1,
                -1, -0.75, -1, -0.5, -1, -0.25, -1, 0, -1, 0.25, -1, 0.5, -1, 0.75, -1, 1
              ];

              var skip_edge_check = [];
              skip_edge_check[16] = true; skip_edge_check[32] = true; skip_edge_check[48] = true; skip_edge_check[64] = true;

              var fan_len = fan.length;
              return function (x, z, s, fd) {
                lfx = fan[0];
                lfz = fan[1];
                fi = fd;
                while (fi < fan_len) {
                  fx = fan[fi]; fz = fan[fi + 1];

                  check_vlevel_value = vmap[((z + fz * s) + vindex_width2) * vindex_width + ((x + fx * s) + vindex_width2)];
                  if (skip_edge_check[fi] || check_vlevel_value < s) {
                    vkey = (z + vindex_width2) * vindex_width + (x + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x;
              output[oi + 2] = z;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z + lfz * s + vindex_width2) * vindex_width + (x + lfx * s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x + lfx * s;
              output[oi + 2] = z + lfz * s;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z + fz * s + vindex_width2) * vindex_width + (x + fx * s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x + fx * s;
              output[oi + 2] = z + fz * s;
              output[oi + 3] = patch_index;
              oi += 6;
                    lfx = fx; lfz = fz;
                  }
                  fi += fd;
                }
              }
            })();
            var check_for_edge_cases = false;

            var qii = 0, rg_QT = null;
            var hh0, hh1, hh2, hh3, hh4;

            function eval_area_height(x, z, s, pndx, slot) {

              hh0 = H(x, z); hh1 = H(x - s, z - s); hh2 = H(x + s, z - s); hh3 = H(x + s, z + s); hh4 = H(x - s, z + s);

              var indx = qii;

              output[indx] = Math.max(
                Math.abs(((hh1 + hh2) * 0.5) - hh0), Math.abs(((hh4 + hh3) * 0.5) - hh0), Math.abs(((hh1 + hh4) * 0.5) - hh0), Math.abs(((hh2 + hh3) * 0.5) - hh0)
              );

              if (pndx > -1) {
                output[pndx + slot] = indx;
              }

              if (s > ORIG_MIN_PATCH_SIZE) {
                qii += 5;
                s *= 0.5;
                output[indx] = Math.max(
                  output[indx],
                  eval_area_height(x - s, z - s, s, indx, 1),
                  eval_area_height(x + s, z - s, s, indx, 2),
                  eval_area_height(x - s, z + s, s, indx, 3),
                  eval_area_height(x + s, z + s, s, indx, 4));
              }

              return output[indx];
            }



            var _RSK = new Float32Array(1024), _si = 0;
            var dd = 0, dlen = 0;
            function rasterize_region(x, z, s,  detail, rg_QT) {
              _si = 0;
              var i = 0;
              _RSK[_si] = x; _RSK[_si + 1] = z; _RSK[_si + 2] = s; _RSK[_si + 3] = i; _si += 4;

              while (_si > 0) {
                _si -= 4;
                x = _RSK[_si]; z = _RSK[_si + 1]; s = _RSK[_si + 2]; i = _RSK[_si + 3];
                dd = detail;

                if (s > WORKING_PATCH_SIZE || (s > WORKING_MIN_PATCH_SIZE && rg_QT[i] > dd)) {
                  s *= 0.5;
                  _RSK[_si] = x + s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 4]; _si += 4;
                  _RSK[_si] = x - s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 3]; _si += 4;
                  _RSK[_si] = x + s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 2]; _si += 4;
                  _RSK[_si] = x - s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 1]; _si += 4;
                }
                else {
                  p = patches[s];
                  p.list[p.i++] = x;
                  p.list[p.i++] = z;
                }
              }
            }

           
            thread[2000] = (function () {


              
              var check_edge_cases;

              function render_patches() {
                s = WORKING_MIN_PATCH_SIZE;
                check_edge_cases = false;
                patch_index = 0;
                while (s <= WORKING_PATCH_SIZE) {
                  p = patches[s];

                  i = 0;
                  j = p.i;
                  while (i < j) {

                    x = p.list[i++];
                    z = p.list[i++];
                    fd = 16;

                    if (check_for_edge_cases) {
                      if (s >= WORKING_MIN_PATCH_SIZE || WORKING_MIN_PATCH_SIZE >= MIN_PATCH_SIZE) {
                        check_edge_cases = false;

                        if (check_vlevel(x - s, z) < s) {
                          check_edge_cases = true;
                        }
                        else if (check_vlevel(x + s, z) < s) {
                          check_edge_cases = true;
                        }
                        else if (check_vlevel(x, z - s) < s) {
                          check_edge_cases = true;
                        }
                        else if (check_vlevel(x, z + s) < s) {
                          check_edge_cases = true;
                        }


                        if (check_edge_cases) {

                          fd = (s / check_vlevel_value);
                          if (fd < 16) {
                            fd = Math.max(2, 8 / fd);
                          }
                          else fd = 2;

                          fd = Math.min(MIN_FAN_DETAIL, fd);
                          if (WORKING_MIN_PATCH_SIZE > MIN_PATCH_SIZE) fd = 2;
                        }
                        else {

                        }
                      }

                    }

                    if (check_for_edge_cases) {
                      draw_fan(x, z, s, fd);
                    }
                    else {
                      vkey = (z - s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x - s;
              output[oi + 2] = z - s;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z - s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x + s;
              output[oi + 2] = z - s;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z + s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x + s;
              output[oi + 2] = z + s;
              output[oi + 3] = patch_index;
              oi += 6;
                      vkey = (z - s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x - s;
              output[oi + 2] = z - s;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z + s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x + s;
              output[oi + 2] = z + s;
              output[oi + 3] = patch_index;
              oi += 6;

              vkey = (z + s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
              output[oi] = x - s;
              output[oi + 2] = z + s;
              output[oi + 3] = patch_index;
              oi += 6;
                    }
                    patch_index++;
                  }
                  s = s * 2;
                }

              }

              var nsize, xn, yn, zn, ss, ni;


              var calc_shadow_map = (function () {
                var ldx, ldy, ldz, cpx, cpy, cpz;

                return function () {
                  ss = MIN_PATCH_SIZE/2;

                  nsize = (region_size / ss);
                  var nmap = new Uint8Array(nsize * nsize * 4);
                  nmap.fill(255);
                  for (zn = 0; zn < region_size; zn += ss) {
                    for (xn = 0; xn < region_size; xn += ss) {


                      cpx = xn;
                      cpy = H(xn, zn);
                      cpz = zn;

                      ldx = (sun_x - reg.x) - cpx;
                      ldy = sun_y - cpy;
                      ldz = (sun_z - reg.z) - cpz;

                      _fp = ldx * ldx + ldy * ldy + ldz * ldz;
                      if (_fp > 0) _fp = 1 / Math.sqrt(_fp);
                      ldx *= _fp;
                      ldy *= _fp;
                      ldz *= _fp;



                      ldx = Math.sign(ldx);
                      ldy = Math.sign(ldy);
                      ldz = Math.sign(ldz);
                      while (cpx > -region_size && cpx < region_size * 2 &&
                        cpz > -region_size && cpz < region_size * 2) {
                        cpx += ldx * (ss / 1);
                        cpy += ldy * (ss / 1);
                        cpz += ldz * (ss / 1);



                        if (cpy <= HH(Math.round(cpx), Math.round(cpz))) {
                          ni = (((zn / ss)) * nsize + ((xn / ss))) * 4;
                          nmap[ni] = 150;
                          /*
                          for (ldz = 0; ldz < ss; ldz++) {
                              for (ldx = 0; ldx < ss; ldx++) {
                                  ni = (((zn / ss) + ldz) * nsize + ((xn / ss) + ldx)) * 4;
                                 // nmap[ni] = 100;
                              }
                          }
                          */
                          break;
                        }
                      }


                    }
                  }
                  reg.smap = true;
                  thread.postMessage([2300, reg.key, nsize, nmap.buffer], [nmap.buffer]);
                  //console.log(reg.key,nmap);
                }
                return function () {
                  ss = 1;
                  nsize = reg.size - 1;
                  var nmap = new Uint8Array(nsize * nsize * 4);
                  nmap.fill(255);
                  for (zn = 0; zn < nsize; zn += ss) {
                    for (xn = 0; xn < nsize; xn += ss) {


                      cpx = xn;
                      cpy = reg.data[zn * reg.size + xn];
                      cpz = zn;

                      ldx = (sun_x - reg.x) - cpx;
                      ldy = sun_y - cpy;
                      ldz = (sun_z - reg.z) - cpz;

                      _fp = ldx * ldx + ldy * ldy + ldz * ldz;
                      if (_fp > 0) _fp = 1 / Math.sqrt(_fp);
                      ldx *= _fp;
                      ldy *= _fp;
                      ldz *= _fp;


                      ni = ((zn / ss) * nsize + (xn / ss)) * 4;

                      while (cpx >= 0 && cpx < region_size - ss && cpz >= 0 && cpz < region_size - ss) {
                        cpx += ldx; cpy += ldy; cpz += ldz;
                        if (cpy <= reg.data[Math.round(cpz) * reg.size + Math.round(cpx)]) {
                          nmap[ni] = 100;
                          break;
                        }
                      }


                    }
                  }

                  thread.postMessage([2300, reg.key, nsize, nmap.buffer], [nmap.buffer]);
                  //console.log(reg.key,nmap);
                }
              })();

              function create_reg_QT(reg) {                
                qii = 0;
                eval_area_height(region_size2, region_size2, region_size2, -1, 0);
                reg.QT = new Float32Array(qii);
                i = 0; while (i < qii) { reg.QT[i] = output[i++]; }
              }


              var process_region = function (reg, detail) {
                if (!reg.QT) {
                  create_reg_QT(reg);
                }
                rg_QT = reg.QT;

                if (!reg.smap && detail < 24) {
                  // calc_shadow_map();
                }
                for (s = WORKING_MIN_PATCH_SIZE; s <= WORKING_PATCH_SIZE; s *= 2) patches[s].i = 0;
                
                rasterize_region(region_size2, region_size2, region_size2, detail, rg_QT);
                render_patches();
              };



              var _xx, _zz;
              var output_uncompressed_data = false;


              var COLLISION_MESH = false;
              function calculate_output_data(is, ie,xo,zo,sc) {
                i = is;
                s = PATCH_SIZE;

                if (COLLISION_MESH) {
                  while (i < ie) {
                    x = output[i]
                    z = output[i + 2];
                    _xx = (x * sc) + xo;
                    _zz = (z * sc) + zo;
                    vkey = (_zz + vindex_width2) * vindex_width + (_xx + vindex_width2);
                    if (vmap[vkey] !== 222) {
                      vmap[vkey] = 222;
                      vkey *= 4;
                      vdata[vkey] = H(x, z);
                      reg.minh = Math.min(reg.minh, vdata[vkey]);
                      reg.maxh = Math.max(reg.maxh, vdata[vkey]);
                    }
                    else {
                      vkey *= 4;
                    }

                    output[i + 1] = vdata[vkey];  
                    output[i] = _xx;
                    output[i + 2] = _zz;

                    i += 6;
                  }

                }
                else {
                  while (i < ie) {
                    x = output[i]
                    z = output[i + 2];
                    _xx = (x * sc) + xo;
                    _zz = (z * sc) + zo;
                    vkey = (_zz + vindex_width2) * vindex_width + (_xx + vindex_width2);
                    if (vmap[vkey] !== 222) {
                      vmap[vkey] = 222;
                      vkey *= 4;
                      vdata[vkey] = H(x, z);

                      nx = (HH(x - s, z) - HH(x + s, z));
                      ny = (s * 2);
                      nz = (HH(x, z - s) - HH(x, z + s));

                      _fp = nx * nx + ny * ny + nz * nz;
                      if (_fp > 0) _fp = 1 / Math.sqrt(_fp);

                      nx = (((nx * _fp) + 1) * 0.5) * 255;
                      ny = (((ny * _fp) + 1) * 0.5) * 255;
                      nz = (((nz * _fp) + 1) * 0.5) * 255;

                      vdata[vkey + 1] = nx;
                      vdata[vkey + 2] = ny;
                      vdata[vkey + 3] = nz;

                      reg.minh = Math.min(reg.minh, vdata[vkey]);
                      reg.maxh = Math.max(reg.maxh, vdata[vkey]);


                    }
                    else {
                      vkey *= 4;
                    }

                    output[i + 1] = vdata[vkey];
                    output[i + 3] = vdata[vkey + 1];
                    output[i + 4] = vdata[vkey + 2];
                    output[i + 5] = vdata[vkey + 3];


                    output[i] = _xx;
                    output[i + 2] = _zz;



                    i += 6;
                  }
                }


                

              }



              function set_terrain_quality(terrain_quality) {
                if (terrain_quality === 0) {
                  PATCH_SIZE = 4;
                  MIN_PATCH_SIZE = 1;
                  MIN_DETAIL = 1;
                  CQT_DETAIL = 4;
                  MIN_FAN_DETAIL = 2;
                }
                else if (terrain_quality === 1) {
                  PATCH_SIZE = 8;
                  MIN_PATCH_SIZE = 2;
                  CQT_DETAIL = 8;
                  MIN_FAN_DETAIL = 2;
                }
                if (terrain_quality === 2) {
                  PATCH_SIZE = 16;
                  MIN_PATCH_SIZE = 4;
                  CQT_DETAIL = 12;
                  MIN_FAN_DETAIL = 2;
                }
                else if (terrain_quality === 3) {
                  PATCH_SIZE = 32;
                  MIN_PATCH_SIZE = 4;
                  CQT_DETAIL = 9;
                  MIN_FAN_DETAIL = 2;
                }
                else if (terrain_quality === 4) {
                  PATCH_SIZE = 32;
                  MIN_PATCH_SIZE = 8;
                  CQT_DETAIL = 24;
                  MIN_FAN_DETAIL = 4;
                }
                else if (terrain_quality === 5) {
                  PATCH_SIZE = 32;
                  MIN_PATCH_SIZE = 16;
                  CQT_DETAIL = 32;
                  MIN_FAN_DETAIL = 4;
                }

                else if (terrain_quality === 6) {
                  PATCH_SIZE = 32;
                  MIN_PATCH_SIZE = 16;
                  CQT_DETAIL = 32;
                  MIN_FAN_DETAIL = 8;
                }

                else if (terrain_quality === 7) {
                  PATCH_SIZE = 64;
                  MIN_PATCH_SIZE = 32;
                  CQT_DETAIL = 32;
                  MIN_FAN_DETAIL = 16;
                }

                else if (terrain_quality === 8) {
                  PATCH_SIZE = 128;
                  MIN_PATCH_SIZE = 64;
                  CQT_DETAIL = 128;
                  MIN_FAN_DETAIL = 32;
                }
                else if (terrain_quality === 9) {
                  PATCH_SIZE = 256;
                  MIN_PATCH_SIZE = 32;
                  CQT_DETAIL = 128;
                  MIN_FAN_DETAIL = 64;
                }
              }


              thread[3000] = function (op, terrain_quality, reg_key, detail, param1, param2, param3, param4,bindex, reg_data_buffer) {
                reg = regions[reg_key];
                if (reg) {
                  if (!reg.QT) {
                    create_reg_QT(reg);
                  }

                  j = reg.QT.length;
                  if (reg_data_buffer.byteLength < j * 4) {
                    reg_data = new Float32Array(j);
                  }
                  else {
                    reg_data = new Float32Array(reg_data_buffer);
                  }
                  reg_data_buffer = reg_data.buffer;

                  reg_data.set(reg.QT, 0);

                  this.postMessage([op, reg_key, detail, MIN_PATCH_SIZE, PATCH_SIZE, j, bindex, reg_data_buffer], [reg_data_buffer]);

                }
              };

              thread[1550] = (function () {              
                return function (op, reg_key, id, px, pz) {
                  reg = regions[reg_key];
                  if (reg) {
                    px -= reg.x;
                    pz -= reg.z;
                    px += region_size2;
                    pz += region_size2;

                    thread.postMessage([op, id, H(Math.floor(px), Math.floor(pz))]);

                  }
                }
              })();

              function rasterize_cqt(x, z, s, qi, detail, pndx, slot) {

                var indx = qii;
                if (pndx > -1) {
                  output[pndx + slot] = indx;
                }

                output[indx] = rg_QT[qi];

                hh1 = H(x - s, z - s); hh2 = H(x + s, z - s); hh3 = H(x + s, z + s); hh4 = H(x - s, z + s);

                output[indx + 1] = hh1; output[indx + 2] = hh2; output[indx + 3] = hh3; output[indx + 4] = hh4;
                output[indx + 5] = Math.max(hh1, hh2, hh3, hh4);

                hh1 = H(x, z - s); hh2 = H(x, z + s); hh3 = H(x + s, z); hh4 = H(x - s, z);

                output[indx + 6] = hh1; output[indx + 7] = hh2; output[indx + 8] = hh3; output[indx + 9] = hh4;
                output[indx + 10] = H(x, z);


                output[indx + 5] = Math.max(output[indx + 5], output[indx + 10], hh1, hh2, hh3, hh4);



                qii += 11;
                if (s > WORKING_PATCH_SIZE || (s > WORKING_MIN_PATCH_SIZE && rg_QT[qi] > detail)) {
                  s *= 0.5;
                  output[indx + 5] = Math.max(
                    output[indx + 5],
                    rasterize_cqt(x - s, z - s, s, rg_QT[qi + 1], detail, indx, 1),
                    rasterize_cqt(x + s, z - s, s, rg_QT[qi + 2], detail, indx, 2),
                    rasterize_cqt(x - s, z + s, s, rg_QT[qi + 3], detail, indx, 3),
                    rasterize_cqt(x + s, z + s, s, rg_QT[qi + 4], detail, indx, 4));

                  return output[indx + 5];
                }


                return output[indx + 5];
              }

              thread[3500] = function (op, terrain_quality, reg_key, detail, param1, param2, param3, param4, bindex, reg_data_buffer) {
                reg = regions[reg_key];
                if (reg) {
                  if (!reg.QT) {
                    create_reg_QT(reg);
                  }
                  rg_QT = reg.QT;
                  qii = 0;
                  rasterize_cqt(region_size2, region_size2, region_size2, 0, Math.abs(detail), -1, 0);


                  j = qii;
                  if (reg_data_buffer.byteLength < j * 4) {
                    reg_data = new Float32Array(j);
                  }
                  else {
                    reg_data = new Float32Array(reg_data_buffer);
                  }
                  reg_data_buffer = reg_data.buffer;

                  i = 0;
                  while (i < qii) {
                    reg_data[i] = output[i++];
                  }

                  this.postMessage([op, reg_key, detail, MIN_PATCH_SIZE, PATCH_SIZE, j, bindex, reg_data_buffer], [reg_data_buffer]);






                }
              };


              



              var detail;

              var req_flags = {
                COLLISION_MESH: 2
              };

              return function (op, terrain_quality, reg_key, reg_detail, cam_x, cam_z, reg_req_flags, param4, bindex, reg_data_buffer) {


                reg = regions[reg_key];
                if (reg) {

                  detail = reg_detail;

                  set_terrain_quality(terrain_quality);




                  check_for_edge_cases = true;

                  if (detail < 0) {
                    
                    detail = Math.abs(detail);
                    check_for_edge_cases = false;
                  } else if (detail > 1000) {
                    check_for_edge_cases = false;
                  }

                  WORKING_PATCH_SIZE = PATCH_SIZE;
                  WORKING_MIN_PATCH_SIZE = MIN_PATCH_SIZE;


                  if ( detail > 32) {
                    WORKING_PATCH_SIZE *= 2;
                    WORKING_MIN_PATCH_SIZE *= 2;
                  }

                  time_start = Date.now();

                  vmap.fill(255);

                  


                  //if (detail < 1000) check_for_edge_cases = true;

                  COLLISION_MESH = false;
                  if (reg_req_flags & req_flags.COLLISION_MESH) {
                    COLLISION_MESH = true;
                    
                  }


                  if (!COLLISION_MESH) render_strips(MIN_PATCH_SIZE);

                  oi = 0;
                  process_region(reg, detail);

                  calculate_output_data(0, oi, 0, 0, 1);



                  j = Math.floor(oi / 6) * 3;





                  if (reg_data_buffer.byteLength < j * 4) {
                    reg_data = new Float32Array(j);
                  }
                  else {
                    reg_data = new Float32Array(reg_data_buffer);
                  }
                  reg_data_buffer = reg_data.buffer;


                  i = 0; j = 0;
                  if (COLLISION_MESH) {

                    while (i < oi) {
                      reg_data[j] = output[i + 2] * region_size1 + output[i];
                      reg_data[j + 1] =  output[i + 1];
                      reg_data[j + 2] = output[i + 3];
                      
                      reg.minh = Math.min(reg.minh, reg_data[j + 1]);
                      reg.maxh = Math.max(reg.maxh, reg_data[j + 1]);
                      i += 6; j += 3;
                    }
                  }
                  else {

                    while (i < oi) {
                      reg_data[j] = output[i + 2] * region_size1 + output[i];
                      reg_data[j + 1] =  output[i + 1];

                      _fp = (output[i + 3] << 16) | (output[i + 4] << 8) | output[i + 5];
                      reg_data[j + 2] = _fp / (1 << 24);

                      reg.minh = Math.min(reg.minh, reg_data[j + 1]);
                      reg.maxh = Math.max(reg.maxh, reg_data[j + 1]);
                      i += 6;
                      j += 3;
                    }
                  }
                 


                   rast_time = Date.now() - time_start;


                  this.postMessage([op, reg_key, reg_detail, reg.minh, reg.maxh, j,
                    bindex, reg_data_buffer],
                    [reg_data_buffer]);

                  //return;
                 // console.log('render reg', rast_time + ' ms /' + reg_key + '/' + reg_detail + '/' + (j / 3));

                };

              }


            })();


            thread.onmessage = function (m) {
              this[m.data[0]].apply(this, m.data);
            };

            eval('(' + worker_overloaded.toString() + ')(thread)');


            thread[9999] = (function () {
              var noise = (function () {
                var noise = {};
                function Grad(x, y, z) { this.x = x; this.y = y; this.z = z; }
                Grad.prototype.dot2 = function (x, y) { return this.x * x + this.y * y; };
                Grad.prototype.dot3 = function (x, y, z) { return this.x * x + this.y * y + this.z * z; };

                var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

                var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103,
                  30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94,
                  252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171,
                  168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
                  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
                  1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159,
                  86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
                  118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183,
                  170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129,
                  22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
                  251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
                  107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4,
                  150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
                  61, 156, 180];

                var perm = new Array(512), gradP = new Array(512);

                var i, v;
                noise.seed = function (seed) {
                  if (seed > 0 && seed < 1) {
                    seed *= 65536;
                  }

                  seed = Math.floor(seed);
                  if (seed < 256) {
                    seed |= seed << 8;
                  }

                  for (i = 0; i < 256; i++) {
                    if (i & 1) {
                      v = p[i] ^ (seed & 255);
                    }
                    else {
                      v = p[i] ^ ((seed >> 8) & 255);
                    }

                    perm[i] = perm[i + 256] = v;
                    gradP[i] = gradP[i + 256] = grad3[v % 12];
                  }
                };
                function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
                function lerp(a, b, t) { return (1 - t) * a + t * b; }
                // 2D Perlin Noise
                var X, Y, n00, n01, n10, n11, u;
                noise.perlin = function (x, y) {
                  // Find unit grid cell containing point
                  X = Math.floor(x);
                  Y = Math.floor(y);
                  // Get relative xy coordinates of point within that cell
                  x = x - X;
                  y = y - Y;
                  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
                  X = X & 255;
                  Y = Y & 255;

                  // Calculate noise contributions from each of the four corners
                  n00 = gradP[X + perm[Y]].dot2(x, y);
                  n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
                  n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
                  n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

                  // Compute the fade curve value for x
                  u = fade(x);

                  // Interpolate the four results
                  return lerp(
                    lerp(n00, n10, u),
                    lerp(n01, n11, u),
                    fade(y)
                  );
                };


                return noise;
              })();

              var div = 0, l = 0, layer, layers, px, pz, elv, ns, o;
              var frequency, amplitude;



              var e, maxe, mine, ofx, ofz, height_scale, reg_x, reg_z;

              
              return function (op, settings, xs, zs, size, scale) {
               // console.log("seet", settings);
                noise.seed(settings.seed);


                ofx = settings.offset_x;
                ofz = settings.offset_z;
                height_scale = settings.height_scale;
                layers = settings.layers;
                for (reg_z = 0; reg_z < size; reg_z++) {
                  for (reg_x = 0; reg_x < size; reg_x++) {

                    px = reg_x + ofx * (size - 1);
                    pz = reg_z + ofz * (size - 1);

                    e = 0;
                    for (l = 0; l < layers.length; l++) {
                      layer = layers[l];

                      frequency = layer.base_roughness;
                      amplitude = 1;


                      ns = 0;
                      for (o = 0; o < layer.octaves; o++) {


                        ns += (noise.perlin(px / size * frequency, pz / size * frequency) / 2.0 + 0.5)
                          * amplitude;


                        frequency *= layer.roughness;
                        amplitude *= layer.persistence;

                      }

                      e += ns * layer.strength;
                    }
                    maxe = Math.max(maxe, e);
                    mine = Math.min(mine, e);
                    output[reg_z * size + reg_x] = e * height_scale;


                    
                  }
                }

                this[200](200, xs, zs, size, output, scale);
              }

            })();


          },
          [this.worker_overloaded]
        );


        this.worker = worker;
        this.worker.processor = this;

        this.update_reg_bounds = function (reg) {
          reg.rad = ((reg.maxh - reg.minh) / 2) * 1;
          reg.y = reg.minh + reg.rad;
          reg.a_minx = Math.min(reg.x - this.region_size_half, reg.x + this.region_size_half);
          reg.a_miny = Math.min(reg.y - reg.rad, reg.y + reg.rad);
          reg.a_minz = Math.min(reg.z - this.region_size_half, reg.z + this.region_size_half);

          reg.a_maxx = Math.max(reg.x - this.region_size_half, reg.x + this.region_size_half);
          reg.a_maxy = Math.max(reg.y - reg.rad, reg.y + reg.rad);
          reg.a_maxz = Math.max(reg.z - this.region_size_half, reg.z + this.region_size_half);

        };

        this.worker[100] = function (op, data_buffer) {

        };

        this.worker[200] = function (op, reg_key, rx, rz, minh, maxh) {
          var reg = this.processor.regions[reg_key] || {
            key: reg_key, last_time: 0, detail: -1,
            reg_x: rx, reg_z: rz, state: 0, req_detail: -1,
            type: 1,
            visibled: true,
          };

          reg.state = 0;
          reg.detail = -1;
          reg.reg_detail = -1;
          reg.maxh = maxh;
          reg.minh = minh;
          reg.x = rx * this.processor.region_size * 1.0;
          reg.z = rz * this.processor.region_size * 1.0;

          

          this.processor.update_reg_bounds(reg);
          this.processor.regions[reg_key] = reg;

          for (var h in this.processor.hosts) {
            this.processor.hosts[h].on_new_region(reg);
          }

        };

        this.worker[300] = function (op, reg_key, cqt_data_buffer) {
          reg = this.processor.regions[reg_key];
          if (reg) {
            reg.CQT = new Int16Array(cqt_data_buffer);
          }
        };

        this.worker[2300] = function (op, reg_key, size, smap) {
          reg = this.processor.regions[reg_key];
          if (reg) {

            console.log(size, smap);
            reg.smap = new ge.webgl.texture( undefined, undefined, undefined, new Uint8Array(smap), undefined, size, size);

            reg.smap.enable_clamp_to_edge();

          }
        };
        
        this.worker[1550] = function (op, id, height) {
          this.processor.query_heights[id] = height;
        };

        this.query_height = function (id, px, pz) {
          reg_x = Math.floor((px / this.region_size) + 0.5);
          reg_z = Math.floor((pz / this.region_size) + 0.5);
          reg_key = reg_z * this.world_size + reg_x;
          reg = this.regions[reg_key];
          this.query_heights[id] = -Infinity;
          if (reg) {
            this.worker.postMessage([1550, reg.key, id, px, pz]);
          }
        }

        worker.request_region = (function () {
          var parking = new fin.queue();


          var reg_data_buffers = [new ArrayBuffer(1), new ArrayBuffer(1), new ArrayBuffer(1)];
          var reg_data_buffers_hosts = [];


          console.log('reg_data_buffers', reg_data_buffers);

          var i = 0;
          function get_buffer_index() {
            i = 0;
            while (i < reg_data_buffers.length) {
              if (reg_data_buffers[i].byteLength > 0) return i;
              i++;
            }
            return -1;
          }

          var bindex = 0;
          worker[2000] = function (op, reg_key, detail, minh, maxh, ri, bindex, reg_data_buffer) {

            reg = this.processor.regions[reg_key];
            reg.minh = minh;
            reg.maxh = maxh;

            
            this.processor.update_reg_bounds(reg);           
            this.processor.hosts[reg_data_buffers_hosts[bindex]].on_region_data(reg, new Float32Array(reg_data_buffer), ri, detail);
            reg_data_buffers[bindex] = reg_data_buffer;
            if (parking.size() > 0) {
              this.region_parked_request(parking.dequeue());
            }

          };


          worker[2010] = function (op, reg_key, detail, minh, maxh, ri, bindex, reg_data_buffer) {            
            reg_data_buffers[bindex] = reg_data_buffer;
            if (parking.size() > 0) {
              this.region_parked_request(parking.dequeue());
            }

          };



          worker[3000] = function (op, reg_key, detail, _MIN_PATCH_SIZE, _PATCH_SIZE, ri, bindex, reg_data_buffer) {            
            this.processor.hosts[reg_data_buffers_hosts[bindex]].on_region_qt(this.processor.regions[reg_key],
              new Float32Array(reg_data_buffer), ri, _MIN_PATCH_SIZE, _PATCH_SIZE, detail);
            reg_data_buffers[bindex] = reg_data_buffer;
            if (parking.size() > 0) {
              this.region_parked_request(parking.dequeue());
            }
          };


          worker[3500] = function (op, reg_key, detail, _MIN_PATCH_SIZE, _PATCH_SIZE, ri, bindex, reg_data_buffer) {
            this.processor.hosts[reg_data_buffers_hosts[bindex]].on_region_cqt(this.processor.regions[reg_key],
              new Float32Array(reg_data_buffer), ri, _MIN_PATCH_SIZE, _PATCH_SIZE, detail);
            reg_data_buffers[bindex] = reg_data_buffer;
            if (parking.size() > 0) {
              this.region_parked_request(parking.dequeue());
            }
          };



          var request_pool = new fin.object_pooler(function () {
           
            return {
              host_id: 0,
              param1: [null, null, null, null, null, null, null, null, null, null],
              param2: [null]
            };
          });

          console.log("request_pool", request_pool);



          worker.region_parked_request = function (req) {
            bindex = get_buffer_index();
            if (bindex > -1) {
              reg_data_buffers_hosts[bindex] = req.host_id;
              req.param1[8] = bindex;
              req.param1[9] = reg_data_buffers[bindex];
              req.param2[0] = reg_data_buffers[bindex];
              this.postMessage(req.param1, req.param2);
              req.param1[9] = null;
              req.param2[0] = null;
              request_pool.free(req);
            }
            else {
              parking.enqueue(req);
            }
          };


          // processor.worker.request_region(2000, this.requested_regions[i++], this.cam_reg_x, this.cam_reg_z).last_time = timer;
          return function (wkm, reg, param1, param2, param3, param4) {
            if (reg.state !== 2) {
              return reg;
            }

            var req = request_pool.get();


            //[null, null, null, null, null, null, null, null, null, null],

            req.param1[0] = wkm;
            req.param1[1] = reg.terrain_quality || this.processor.terrain_quality;
            req.param1[2] = reg.key;
            req.param1[3] = reg.req_detail;

            req.param1[4] = param1;
            req.param1[5] = param2;
            req.param1[6] = param3;
            req.param1[7] = param4;


            bindex = get_buffer_index();
            if (bindex > -1) {
              reg_data_buffers_hosts[bindex] = reg.host_id;
              req.param1[8] = bindex;
              req.param1[9] = reg_data_buffers[bindex];
              req.param2[0] = reg_data_buffers[bindex];
              this.postMessage(req.param1, req.param2);
              
              req.param1[5] = null;
              req.param2[0] = null;
              request_pool.free(req);
            }
            else {
              req.host_id = reg.host_id;
              parking.enqueue(req);
            }


            return reg;

          }


        })();


        this.worker.onmessage = function (m) {
          this[m.data[0]].apply(this, m.data);
        };

       

      }
    })();


    var reg, reg_x, reg_z, reg_key, i = 0, render_item = null;
    proto.initialize = function () {
      this.update_terrain_parameters();
      if (this.def_regions_from_image_url) {
        for (i = 0; i < this.def_regions_from_image_url.length; i++) {
          this.regions_from_image_url.apply(this, this.def_regions_from_image_url[i]);
        }
      }
      if (this.on_initialized !== null) this.on_initialized(this);
      this.initialized = true;

    };


    proto.add_host = function (host) {
      host.host_id = ge.guidi();
      this.hosts[host.host_id] = host;
    };

    function ge_terrain_processor(def) {
      def = def || {};

      this.region_size = def.region_size || 512;
      this.world_size = def.world_size || (4096 * 2);
      this.region_size_width = this.region_size + 1;
      this.region_size_half = this.region_size * 0.5;


      this.regions = {};

      this.world_size_half = this.world_size * 0.5;


      this.timer = 0;

      this.last_validate_time = 0;
      this.last_updated_time = 0;
      this.terrain_quality = def.terrain_quality || 4;

      this.sun_direction = def.sun_direction || [0.5, 0.5, 0.3];

      this.worker_overloaded = "var worker_overloaded=function(thread){}";
      if (def.worker) {
        this.worker_overloaded = "var worker_overloaded=" + def.worker.toString();
      }
      this.setup_mesh_processor();
      this.def_regions_from_image_url = def.regions_from_image_url;

      this.on_initialized = def.on_initialized || null;
      this.initialized = false;
      this.initialize();
      this.hosts = {};
      this.query_heights = {};
    }



    return ge_terrain_processor;
  });

  


  var glsl = ge.webgl.shader.create_chunks_lib(`/*chunk-default-material*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
uniform mat4 u_view_projection_rw;

uniform vec4 reg_pos;
uniform vec3 cam_reg_pos;

uniform vec3 u_terrain_scale;




varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec2 v_uv_rw;
varying mat3 v_tbn_matrix;


<?=chunk('mat3-transpose')?>

void vertex(void){
  v_position_rw.z=floor(a_position_rw.x/cam_reg_pos.z);
  v_position_rw.x=floor(mod(a_position_rw.x,cam_reg_pos.z));
  v_position_rw.y=a_position_rw.y;  


  v_normal_rw.x = fract(a_position_rw.z);
  v_normal_rw.y = fract(a_position_rw.z* 256.0);  
  v_normal_rw.z = fract(a_position_rw.z * 65536.0);  


   v_normal_rw.x = (v_normal_rw.x * 2.0) - 1.0;
  v_normal_rw.y = (v_normal_rw.y * 2.0) - 1.0;
  v_normal_rw.z = (v_normal_rw.z * 2.0) - 1.0;  


  v_position_rw.w=1.0; 
  
  //v_position_rw.xyz+=(v_normal_rw*u_terrain_scale);

  v_uv_rw=v_position_rw.xz/cam_reg_pos.z;        
  
  //v_uv_rw+=0.5;

  v_position_rw.xyz*=u_terrain_scale;
  
 //  v_position_rw.xz-=((cam_reg_pos.z)*0.5);
  // v_position_rw.xz*=reg_pos.w;

  //v_position_rw.xz*=0.99;
  v_position_rw.xz+=reg_pos.xz;   
 // v_position_rw.y=0.0;

 

  gl_Position = u_view_projection_rw *v_position_rw;

 // v_uv_rw=v_position_rw.xz;        
 // v_uv_rw/=(cam_reg_pos.z);    
  v_normal_rw=normalize(v_normal_rw);

}

<?=chunk('precision')?>

uniform mat4 u_object_material_rw;
uniform vec4 u_eye_position_rw;
uniform vec4 reg_pos;
uniform vec3 cam_reg_pos;

varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec2 v_uv_rw;
varying mat3 v_tbn_matrix;

<?=chunk('global-render-system-lighting')?>

<?=chunk('global-render-system-fog-effect')?>


uniform vec4 land_color;

uniform sampler2D u_texture_tiles_rw;
uniform sampler2D u_normalmap_tiles_rw;
uniform sampler2D u_shadow_map_rw;

uniform vec2 u_tile_size_rw;
uniform vec4 u_texture_repeat_rw;
uniform vec4 u_normalmap_repeat_rw;

float tile_size;
vec2 tile_uv;
vec2 uv=vec2(0);
float tile_offset;

vec4 mix_texture_tiles(vec4 tile1,vec4 tile2,vec4 tile3,vec4 tile4,vec3 normal);
vec3 mix_normal_tiles(vec3 tile1,vec3 tile2,vec3 tile3,vec3 tile4,vec3 normal);

vec4 read_tile(sampler2D texture,float tile_repeat, float tx,float ty);

vec3 mix_normal_tiles(vec3 tile1,vec3 tile2,vec3 tile3,vec3 tile4,vec3 normal){


	return mix(tile1,tile4,abs(normal.x));
}

vec4 mix_texture_tiles(vec4 tile1,vec4 tile2,vec4 tile3,vec4 tile4,vec3 normal){
	return mix(tile4,tile2,0.5);
}


vec4 read_tile(sampler2D texture,float tile_repeat, float tx,float ty){

    uv.x=mod(v_uv_rw.x*tile_repeat,tile_size-(tile_offset*2.0));
    uv.y=mod(v_uv_rw.y*tile_repeat,tile_size-(tile_offset*2.0));
    uv.x+=tx*tile_size+tile_offset;
    uv.y+=ty*tile_size+tile_offset;
    return texture2D(texture, uv);
}



vec2 texelSize=vec2(1.0/128.0,1.0/128.0);
float sample_smap(vec2 coords){	
	vec2 pixelPos = coords / texelSize + vec2(0.5);
	vec2 fracPart = fract(pixelPos);
	vec2 startTexel = (pixelPos - fracPart) * texelSize;
	float blTexel = texture2D(u_shadow_map_rw, startTexel).r;
	float brTexel = texture2D(u_shadow_map_rw, startTexel + vec2(texelSize.x, 0.0)).r;
	float tlTexel = texture2D(u_shadow_map_rw, startTexel + vec2(0.0, texelSize.y)).r;
	float trTexel = texture2D(u_shadow_map_rw, startTexel + texelSize).r;
	float mixA = mix(blTexel, tlTexel, fracPart.y);
	float mixB = mix(brTexel, trTexel, fracPart.y);
	return mix(mixA, mixB, fracPart.x);
}



float sample_smap_pcf(vec2 coords)
{
	const float NUM_SAMPLES = 3.0;
	const float SAMPLES_START = (NUM_SAMPLES - 1.0) / 2.0;
	const float NUM_SAMPLES_SQUARED = NUM_SAMPLES * NUM_SAMPLES;
	float result = 0.0;
	for (float y = -SAMPLES_START; y <= SAMPLES_START; y += 1.0)
	{
		for (float x = -SAMPLES_START; x <= SAMPLES_START; x += 1.0)
		{
			vec2 coordsOffset = vec2(x, y) * texelSize;
			result += sample_smap(coords + coordsOffset);
		}
	}
	return result / NUM_SAMPLES_SQUARED;
}




void fragment(void) {	

tile_size=u_tile_size_rw.x;
tile_offset=u_tile_size_rw.y;




  
	vec4 tile1=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.x, 0.0,0.0);
	vec4 tile2=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.y, 1.0,0.0);
	vec4 tile3=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.z, 0.0,1.0);
	vec4 tile4=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.w, 1.0,1.0);

	vec3 norm1=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.x, 0.0,0.0).xyz - 1.0);
	vec3 norm2=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.y, 1.0,0.0).xyz - 1.0);
	vec3 norm3=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.z, 0.0,1.0).xyz - 1.0);
	vec3 norm4=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.w, 1.0,1.0).xyz - 1.0);



	
	vec3 normal= mix_normal_tiles(norm1,norm2,norm3,norm4,v_normal_rw);
	normal=normalize(v_normal_rw+normal);

	 vec3 fws_direction_to_eye = normalize(u_eye_position_rw.xyz - v_position_rw.xyz);		
	vec3 total_light=get_render_system_lighting(u_object_material_rw,v_position_rw.xyz,
	normal,
	fws_direction_to_eye);
	
	//*texture2D(u_shadow_map_rw, v_uv_rw).r;	

	


	gl_FragColor = vec4((total_light)*(land_color.xyz), u_object_material_rw[0].w)*	
	mix_texture_tiles(tile1,tile2,tile3,tile4,normal);

	gl_FragColor*=sample_smap_pcf(v_uv_rw);
	//gl_FragColor = texture2D(u_shadow_map_rw, v_uv_rw);

	//gl_FragColor=mix_fog_color(gl_FragColor);
	//gl_FragColor=texture2D(u_texture_tiles_rw, v_uv_rw);
	//gl_FragColor=vec4(1.0);
}




















/*chunk-default-patch-material*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
uniform mat4 u_view_projection_rw;

varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec2 v_uv_rw;
varying mat3 v_tbn_matrix;


<?=chunk('mat3-transpose')?>

void vertex(void){
  v_position_rw.z=floor(a_position_rw.x/cam_reg_pos.z);
  v_position_rw.x=floor(mod(a_position_rw.x,cam_reg_pos.z));
  v_position_rw.y=a_position_rw.y;  


  v_normal_rw.x = fract(a_position_rw.z);
  v_normal_rw.y = fract(a_position_rw.z* 256.0);  
  v_normal_rw.z = fract(a_position_rw.z * 65536.0);  


   v_normal_rw.x = (v_normal_rw.x * 2.0) - 1.0;
  v_normal_rw.y = (v_normal_rw.y * 2.0) - 1.0;
  v_normal_rw.z = (v_normal_rw.z * 2.0) - 1.0;  


  v_position_rw.w=1.0; 
  
  //v_position_rw.xyz+=(v_normal_rw*u_terrain_scale);

  v_uv_rw=v_position_rw.xz/cam_reg_pos.z;        
  
  //v_uv_rw+=0.5;

  v_position_rw.xyz*=u_terrain_scale;
  
 //  v_position_rw.xz-=((cam_reg_pos.z)*0.5);
  // v_position_rw.xz*=reg_pos.w;

  //v_position_rw.xz*=0.99;
  v_position_rw.xz+=reg_pos.xz;   
 // v_position_rw.y=0.0;

 

  gl_Position = u_view_projection_rw *v_position_rw;

 // v_uv_rw=v_position_rw.xz;        
 // v_uv_rw/=(cam_reg_pos.z);    
  v_normal_rw=normalize(v_normal_rw);

}

<?=chunk('precision')?>

uniform mat4 u_object_material_rw;
uniform vec4 u_eye_position_rw;
uniform vec4 reg_pos;
uniform vec3 cam_reg_pos;

varying vec4 v_position_rw;
varying vec3 v_normal_rw;
varying vec2 v_uv_rw;
varying mat3 v_tbn_matrix;

<?=chunk('global-render-system-lighting')?>

<?=chunk('global-render-system-fog-effect')?>


uniform vec4 land_color;

uniform sampler2D u_texture_tiles_rw;
uniform sampler2D u_normalmap_tiles_rw;
uniform sampler2D u_shadow_map_rw;

uniform vec2 u_tile_size_rw;
uniform vec4 u_texture_repeat_rw;
uniform vec4 u_normalmap_repeat_rw;

float tile_size;
vec2 tile_uv;
vec2 uv=vec2(0);
float tile_offset;

vec4 mix_texture_tiles(vec4 tile1,vec4 tile2,vec4 tile3,vec4 tile4,vec3 normal);
vec3 mix_normal_tiles(vec3 tile1,vec3 tile2,vec3 tile3,vec3 tile4,vec3 normal);

vec4 read_tile(sampler2D texture,float tile_repeat, float tx,float ty);

vec3 mix_normal_tiles(vec3 tile1,vec3 tile2,vec3 tile3,vec3 tile4,vec3 normal){


	return mix(tile1,tile4,abs(normal.x));
}

vec4 mix_texture_tiles(vec4 tile1,vec4 tile2,vec4 tile3,vec4 tile4,vec3 normal){
	return mix(tile4,tile2,0.5);
}


vec4 read_tile(sampler2D texture,float tile_repeat, float tx,float ty){

    uv.x=mod(v_uv_rw.x*tile_repeat,tile_size-(tile_offset*2.0));
    uv.y=mod(v_uv_rw.y*tile_repeat,tile_size-(tile_offset*2.0));
    uv.x+=tx*tile_size+tile_offset;
    uv.y+=ty*tile_size+tile_offset;
    return texture2D(texture, uv);
}



vec2 texelSize=vec2(1.0/128.0,1.0/128.0);
float sample_smap(vec2 coords){	
	vec2 pixelPos = coords / texelSize + vec2(0.5);
	vec2 fracPart = fract(pixelPos);
	vec2 startTexel = (pixelPos - fracPart) * texelSize;
	float blTexel = texture2D(u_shadow_map_rw, startTexel).r;
	float brTexel = texture2D(u_shadow_map_rw, startTexel + vec2(texelSize.x, 0.0)).r;
	float tlTexel = texture2D(u_shadow_map_rw, startTexel + vec2(0.0, texelSize.y)).r;
	float trTexel = texture2D(u_shadow_map_rw, startTexel + texelSize).r;
	float mixA = mix(blTexel, tlTexel, fracPart.y);
	float mixB = mix(brTexel, trTexel, fracPart.y);
	return mix(mixA, mixB, fracPart.x);
}



float sample_smap_pcf(vec2 coords)
{
	const float NUM_SAMPLES = 3.0;
	const float SAMPLES_START = (NUM_SAMPLES - 1.0) / 2.0;
	const float NUM_SAMPLES_SQUARED = NUM_SAMPLES * NUM_SAMPLES;
	float result = 0.0;
	for (float y = -SAMPLES_START; y <= SAMPLES_START; y += 1.0)
	{
		for (float x = -SAMPLES_START; x <= SAMPLES_START; x += 1.0)
		{
			vec2 coordsOffset = vec2(x, y) * texelSize;
			result += sample_smap(coords + coordsOffset);
		}
	}
	return result / NUM_SAMPLES_SQUARED;
}




void fragment(void) {	

tile_size=u_tile_size_rw.x;
tile_offset=u_tile_size_rw.y;




  
	vec4 tile1=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.x, 0.0,0.0);
	vec4 tile2=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.y, 1.0,0.0);
	vec4 tile3=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.z, 0.0,1.0);
	vec4 tile4=read_tile(u_texture_tiles_rw,u_texture_repeat_rw.w, 1.0,1.0);

	vec3 norm1=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.x, 0.0,0.0).xyz - 1.0);
	vec3 norm2=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.y, 1.0,0.0).xyz - 1.0);
	vec3 norm3=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.z, 0.0,1.0).xyz - 1.0);
	vec3 norm4=(2.0 * read_tile(u_normalmap_tiles_rw,u_normalmap_repeat_rw.w, 1.0,1.0).xyz - 1.0);



	
	vec3 normal= mix_normal_tiles(norm1,norm2,norm3,norm4,v_normal_rw);
	normal=normalize(v_normal_rw+normal);

	 vec3 fws_direction_to_eye = normalize(u_eye_position_rw.xyz - v_position_rw.xyz);		
	vec3 total_light=get_render_system_lighting(u_object_material_rw,v_position_rw.xyz,
	normal,
	fws_direction_to_eye);
	
	//*texture2D(u_shadow_map_rw, v_uv_rw).r;	

	


	gl_FragColor = vec4((total_light)*(land_color.xyz), u_object_material_rw[0].w)*	
	mix_texture_tiles(tile1,tile2,tile3,tile4,normal);

	gl_FragColor*=sample_smap_pcf(v_uv_rw);
	//gl_FragColor = texture2D(u_shadow_map_rw, v_uv_rw);

	//gl_FragColor=mix_fog_color(gl_FragColor);
	//gl_FragColor=texture2D(u_texture_tiles_rw, v_uv_rw);
	//gl_FragColor=vec4(1.0);
}










/*chunk-oclusion*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
uniform mat4 u_view_projection_rw;
uniform vec3 reg_pos;
uniform vec3 cam_reg_pos;

void vertex(void){
  gl_Position.z=floor(a_position_rw.x/cam_reg_pos.z);
  gl_Position.x=floor(mod(a_position_rw.x,cam_reg_pos.z));
  gl_Position.y=a_position_rw.y; 
  gl_Position.w=1.0;     
  gl_Position.xz+=reg_pos.xz;    
  gl_Position = u_view_projection_rw *gl_Position;
}

<?=chunk('precision')?>
uniform vec4 land_color;
void fragment(void) {	
	gl_FragColor=land_color/255.0;

}








`);


  ge.terrain.material = ge.define(function (proto, _super) {

    proto.render_mesh = function (renderer, shader, mesh) {


      if (!mesh.renderer) {
        mesh.renderer = renderer;
        return;
      }

      if (this.flags & 1024) {
          renderer.gl_disable(2929);
        }
        else {
          renderer.gl_enable(2929);
        }
        if ((this.flags & 2048) !== 0) {
          renderer.gl_disable(2884);
        }
        else {
          renderer.gl_enable(2884);
        }

      shader.set_uniform("u_object_material_rw", this.object_material);

      this.tile_size[0] = this.texture_tiles.tile_sizef;
      this.tile_size[1] = this.texture_tiles.tile_offsetf;

      shader.set_uniform("u_tile_size_rw", this.tile_size);
      shader.set_uniform("u_texture_repeat_rw", this.texture_repeat);
      shader.set_uniform("u_normalmap_repeat_rw", this.normalmap_repeat);

      renderer.use_texture(this.texture_tiles, 0);
      renderer.use_texture(this.normalmap_tiles, 1);


      shader.set_uniform("u_normalmap_tiles_rw", 1);



      mesh.render_terrain(renderer, shader);








    };

    function ge_terrain_material(def) {
      def = def || {};
      _super.apply(this, [def]);
      math.vec3.set(this.ambient, 0.5, 0.5, 0.5);
      math.vec3.set(this.specular, 0, 0, 0);
      this.flags += 32;
      this.texture_tiles = null;
      this.normalmap_tiles = null;

      this.tile_size = math.vec2(512, 0);
      this.texture_repeat = math.vec4(def.tile_repeat || [8, 8, 8, 8]);
      this.normalmap_repeat = math.vec4(1, 1, 1, 1);


      this.shader = ge_terrain_material.shader;

      if (def.normalmap_tiles) {
        this.normalmap_tiles = ge.webgl.texture.create_tiled_texture(def.normalmap_tiles,
          def.material.tile_size || 512,
          def.material.texture_size || 1024,
          def.material.texture_size || 1024
        );
      }
      else {
        this.normalmap_tiles = new ge.webgl.texture();
      }

      if (def.texture_tiles) {
        this.texture_tiles = ge.webgl.texture.create_tiled_texture(def.texture_tiles,
          def.tile_size || 512,
          def.texture_size || 1024,
          def.texture_size || 1024
        );

        this.texture_tiles.enable_clamp_to_edge();
      }
      else {
        this.texture_tiles = new ge.webgl.texture();
        this.texture_tiles.tile_sizef = 1.0;
        this.texture_tiles.tile_offsetf = 1.0;
      }

      if (def.transparent !== undefined) {
        this.set_tansparency(def.transparent);
      }

      if (def.shader) {
        this.shader = this.shader.extend(def.shader);
      }
      //this.flags += 2;




    }

    ge_terrain_material.shader = ge.webgl.shader.parse(glsl["default-material"]);


    return ge_terrain_material;


  }, ge.shading.shaded_material);




  ge.terrain.material.oclusion = ge.define(function (proto, _super) {

    proto.render_mesh = function (renderer, shader, mesh) {


      if (!mesh.renderer) {
        mesh.renderer = renderer;
        return;
      }

      if (this.flags & 1024) {
          renderer.gl_disable(2929);
        }
        else {
          renderer.gl_enable(2929);
        }
        if ((this.flags & 2048) !== 0) {
          renderer.gl_disable(2884);
        }
        else {
          renderer.gl_enable(2884);
        }

      mesh.render_terrain(renderer, shader);



    };

    function ge_terrain_material_oclusion(def) {
      def = def || {};
      _super.apply(this, [def]);
      this.shader = ge_terrain_material_oclusion.shader;
      if (def.shader) {
        this.shader = this.shader.extend(def.shader);
      }
      this.flags += 2;

    }

    
    ge_terrain_material_oclusion.shader = ge.webgl.shader.parse(glsl["oclusion"]);


    return ge_terrain_material_oclusion;


  }, ge.shading.material);




  ge.terrain.mesh = ge.define(function (proto, _super) {



    proto.update = (function () {


      proto.validate_regions = (function () {
        var rk, reg;
        return function () {
          if (this.timer - this.last_validate_time < 5) return;
          this.last_validate_time = this.timer;
          for (rk in this.regions) {
            reg = this.regions[rk];
            if (reg.state > 0 && this.timer - reg.last_time > 2) {
              reg.last_time = this.timer;
              if (reg.buffer) {
                ge.renderer.gl_buffers.free(reg.buffer);
                reg.buffer = undefined;
                reg.detail = -1;
                this.on_region_dispose(reg);
              }
            }
          }
        }
      })();


      proto.request_region = function (lreg, detail) {

      
        
        if (lreg.detail !== detail && lreg.state !== 2) {
          lreg.req_detail = detail;
          lreg.state = 2;
          this.requested_regions[this.rqi++] = lreg;
        }
        if (lreg.buffer) {
          this.on_region_activated(lreg);
          this.regions_to_render[this.ri++] = lreg;
        }
        lreg.last_time = this.timer;
      };
      
      proto.update_terrain_frustum = (function () {
        var reg_dist = 0, fminx, fminy, fminz, fminx, fminy, fminz, fss;
        var lreg, reg, processor, region_size;
        function dist3d(x, y, z) {
          return Math.abs(Math.sqrt(x * x + y * y + z * z));
        }
        return function (x, z, s) {

          processor = this.processor;

          region_size = processor.region_size;

          reg_x = (this.cam_reg_x + (x + 0.5)) * region_size;
          reg_z = (this.cam_reg_z + (z + 0.5)) * region_size;


          if (s > 0.5) {
            fss = s * region_size;
            fminx = Math.min(reg_x - fss, reg_x + fss);
            fminy = -400;
            fminz = Math.min(reg_z - fss, reg_z + fss);

            fmaxx = Math.max(reg_x - fss, reg_x + fss);
            fmaxy = this.draw_distance;
            fmaxz = Math.max(reg_z - fss, reg_z + fss);

            if (this.camera._frustum_aabb(fminx, fminy, fminz, fmaxx, fmaxy, fmaxz)) {
              s *= 0.5;
              this.update_terrain_frustum(x - s, z - s, s);
              this.update_terrain_frustum(x + s, z - s, s);
              this.update_terrain_frustum(x - s, z + s, s);
              this.update_terrain_frustum(x + s, z + s, s);
              return;
            }
          }
          else {
            reg_x = this.cam_reg_x + (x + 0.5);
            reg_z = this.cam_reg_z + (z + 0.5);
            reg_key = reg_z * processor.world_size + reg_x;

            reg = processor.regions[reg_key];

            if (reg) {
              lreg = this.regions[reg_key];
              if (this.camera._frustum_aabb(reg.a_minx, reg.a_miny, reg.a_minz, reg.a_maxx, reg.a_maxy, reg.a_maxz)) {
              /*
                reg_dist = (
                  Math.abs((this.camera.world_position[0] - reg.x)) + Math.abs(this.camera.world_position[1] - reg.y) + Math.abs((this.camera.world_position[2] - reg.z)));

*/
                reg_dist = dist3d(this.camera.world_position[0] - reg.x, this.camera.world_position[1] - reg.y, this.camera.world_position[2] - reg.z);
                lreg.distance = reg_dist;

                if (reg_dist - processor.region_size_half > this.draw_distance ) {
                  return;
                }

                if (this.region_margin > 1) {
                  if (Math.abs(reg.reg_x % this.region_margin) !== 0 || Math.abs(reg.reg_z % this.region_margin) !== 0) {
                    return;
                  }
                }

                if (this.fixed_detail !== -1) {
                  this.request_region(lreg, this.fixed_detail);
                }
                else {

                  if (lreg.distance < processor.region_size) {
                    this.request_region(lreg, this.detail_levels[0]);
                  }
                  else {
                    reg_dist = Math.min(reg_dist / this.quality_distance, 1);
                    this.request_region(lreg, this.detail_levels[Math.floor((this.detail_levels.length - 1) * reg_dist)]);
                  }

                }

              }
            }


          }

        }
        return function (x, z, s) {

          processor = this.processor;

          region_size = processor.region_size;

          reg_x = (this.cam_reg_x + (x + 0.5)) * region_size;
          reg_z = (this.cam_reg_z + (z + 0.5)) * region_size;


          if (s > 0.5) {
            fss = s * region_size;
            fminx = Math.min(reg_x - fss, reg_x + fss);
            fminy = -this.draw_distance;
            fminz = Math.min(reg_z - fss, reg_z + fss);

            fmaxx = Math.max(reg_x - fss, reg_x + fss);
            fmaxy = this.draw_distance;
            fmaxz = Math.max(reg_z - fss, reg_z + fss);

            if (this.camera._frustum_aabb(fminx, fminy, fminz, fmaxx, fmaxy, fmaxz)) {
              s *= 0.5;
              this.update_terrain_frustum(x - s, z - s, s);
              this.update_terrain_frustum(x + s, z - s, s);
              this.update_terrain_frustum(x - s, z + s, s);
              this.update_terrain_frustum(x + s, z + s, s);
              return;
            }
          }
          else {
            reg_x = this.cam_reg_x + (x + 0.5);
            reg_z = this.cam_reg_z + (z + 0.5);
            reg_key = reg_z * processor.world_size + reg_x;

            reg = processor.regions[reg_key];

            if (reg) {
              lreg = this.regions[reg_key];
              if (this.camera._frustum_aabb(reg.a_minx, reg.a_miny, reg.a_minz, reg.a_maxx, reg.a_maxy, reg.a_maxz)) {
                reg_dist = (
                  Math.abs((this.camera.world_position[0] - reg.x)) +
                  Math.abs(this.camera.world_position[1] - reg.y) +
                  Math.abs((this.camera.world_position[2] - reg.z))

                );
                lreg.distance = reg_dist;

                if (reg_dist - processor.region_size_half > this.draw_distance ) {
                  return;
                }
                if (reg_dist < this.region_offset * (region_size * this.region_margin)) {
                 // return;
                }


                if (this.region_margin > 1) {
                  if (Math.abs(reg.reg_x % this.region_margin) !== 0 || Math.abs(reg.reg_z % this.region_margin) !== 0) {
                    return;
                  }
                }

                this.request_region(lreg, this.fixed_detail);

              }
            }


          }

        }

        
      })();



      var sort_regions_func = function (a, b) {
        return a.distance - b.distance;
      };
      var update_time_delta = 0;
      
      return function (camera, timer) {
        this.camera = camera;
        this.timer = timer;
        var processor = this.processor;

        update_time_delta = timer - this.last_updated_time;
        if (update_time_delta < this.time_step_size) {
          return;
        }
        this.last_updated_time = timer - (update_time_delta % this.time_step_size);


        this.camera_version = this.camera.version;


        this.cam_reg_x = Math.floor((this.camera.world_position[0] / processor.region_size) + 0.5) ;
        this.cam_reg_z = Math.floor((this.camera.world_position[2] / processor.region_size) + 0.5);


        this.cam_reg = this.regions[this.cam_reg_z * this.processor.world_size + this.cam_reg_x];

        if (this.cam_reg) {

        
          if (processor.query_heights[-1024] > -Infinity) {

            if (this.camera_pos_y === 0) {
              this.camera_pos_y = processor.query_heights[-1024];
            }
            else {
              this.camera_pos_y += ( (processor.query_heights[-1024]-this.height_on_camera ) % 42);
            }

            
           // console.log(this.camera_vel_y);
            this.height_on_camera = processor.query_heights[-1024];
           // this.camera_pos_y=this.height_on_camera+50;
            processor.query_heights[-1024] = -Infinity;

            this.camera_pos_y = Math.max(this.height_on_camera, this.camera_pos_y);

          }
          if (this.camera_pos_x !== this.camera.world_position[0] || this.camera_pos_z !== this.camera.world_position[2]) {
            this.camera_pos_x = this.camera.world_position[0];
            this.camera_pos_z = this.camera.world_position[2];
           // this.camera_pos_y = this.camera.world_position[1];
            processor.query_height(-1024, this.camera_pos_x, this.camera_pos_z);
          }

         //this.camera_pos_y += this.camera_vel_y;
          this.camera_vel_y -= this.camera_vel_y * 0.1;
          this.camera_vel_y = Math.max(0, this.camera_vel_y);
        }
        this.update_requested = false;
        this.last_updated_time = timer;
        

        this.ri = 0;
        this.rqi = 0;
        this.er = 0;


        this.update_terrain_frustum(0, 0, this.region_distance * this.region_margin);

        if (this.rqi > 0) {
          this.requested_regions = fin.merge_sort(this.requested_regions, this.rqi, sort_regions_func);
          i = 0;
          if (this.region_margin > 1) {
            while (i < this.rqi) {
              processor.worker.request_region(5000, this.requested_regions[i++], this.region_margin,
                this.region_offset, this.cam_reg_z, this.cam_reg_x).last_time = timer;
            }
          }
          else{
            while (i < this.rqi) {
              processor.worker.request_region(2000, this.requested_regions[i++], this.cam_reg_x, this.cam_reg_z, this.reg_req_flags).last_time = timer;
            }
          }
          

        }
        i = 0;

        this.validate_regions();


      }



    })();

    proto.on_new_region = function (reg) {
      if (!this.regions[reg.key]) {
        this.regions[reg.key] = {
          key: reg.key,
          host_id: this.host_id,
          req_detail: 0,
          terrain_quality: this.terrain_quality,
          last_time: 0
        };
      }
      else {
        this.regions[reg.key].reg_detail = 0;
        this.regions[reg.key].detail = 0;
      }
      return this.regions[reg.key];

    };
    proto.on_region_dispose = function (reg) {

    }

    proto.on_region_activated = function (reg) {

    }

    proto.on_region_data = function (reg, data, size, detail) {
      
      var lreg = this.regions[reg.key];

    
      lreg.state = 1;

      if (!this.renderer) return;
      lreg.ds = 0;
      lreg.di = size / 3;
      lreg.detail = detail;


      lreg.buffer = lreg.buffer || ge.renderer.gl_buffers.get(this.renderer.gl);
      this.renderer.gl.bindBuffer(34962, lreg.buffer);
      this.renderer.gl.bufferData(34962, data, 35048, 0, size);
      this.on_region_activated(lreg);


      if (this.region_margin > 1) {

        var region_size_half = this.processor.region_size_half * this.region_margin;
        
        reg.a_minx = Math.min(reg.x - region_size_half, reg.x + region_size_half);
        reg.a_minz = Math.min(reg.z - region_size_half, reg.z + region_size_half);

        reg.a_maxx = Math.max(reg.x - region_size_half, reg.x + region_size_half);        
        reg.a_maxz = Math.max(reg.z - region_size_half, reg.z + region_size_half);

      }
      return lreg;

    };

    proto.on_region_render = function (reg, renderer, shader) {

    }

    proto.render_terrain = (function () {

      var reg_pos = math.vec4();
      var cam_reg_pos = math.vec3();
      var u_color_id_rw = new Float32Array(4);
      var uint32_color_id = new Uint32Array(1);
      var bytes_color_id = new Uint8Array(uint32_color_id.buffer);
      var lreg, reg, uni, i = 0, rd = 0;
      return function (renderer, shader) {

        cam_reg_pos[0] = this.cam_reg_x * this.processor.region_size;
        cam_reg_pos[1] = this.cam_reg_z * this.processor.region_size;

        


        uni = shader.uniforms["cam_reg_pos"]; uni.params[uni.params_length] = cam_reg_pos; uni.func.apply(shader.gl, uni.params);

        cam_reg_pos[2] = this.processor.region_size + 1;

        renderer.use_texture(renderer.default_texture, 2);

        uni = shader.uniforms["u_shadow_map_rw"];
      if (uni) {
        uni.params[uni.params_length] = 2;
        uni.func.apply(shader.gl, uni.params);
      }

        uni = shader.uniforms["u_terrain_scale"];
      if (uni) {
        uni.params[uni.params_length] = this.terrian_scale;
        uni.func.apply(shader.gl, uni.params);
      };

        this.time_start = Date.now();



        renderer.bind_default_wireframe_indices();

        this.tri_count = 0;
        i = 0;
        this.region_max_tris = 0;
        this.rendered_regions = 0;
        while (i < this.ri) {
          lreg = this.regions_to_render[i++];
          reg = this.processor.regions[lreg.key];

          lreg.last_time = this.timer;

          if (this.region_offset > 0) {
            rd = Math.floor(Math.abs((this.cam_reg_x - reg.reg_x)) + Math.abs((this.cam_reg_z - reg.reg_z)));

            if (rd < this.region_offset) continue;
          }
          

          if (lreg.buffer) {


            this.tri_count += lreg.di;

            this.region_max_tris = Math.max(this.region_max_tris, lreg.di);


            if (this.region_margin > 1) {
              reg_pos[0] = reg.x - (this.processor.region_size_half * this.region_margin);
              reg_pos[2] = reg.z - (this.processor.region_size_half * this.region_margin );
            }
            else {
              reg_pos[0] = reg.x - this.processor.region_size_half;
              reg_pos[2] = reg.z - this.processor.region_size_half;
            }
            

            reg_pos[1] = 0;
            reg_pos[3] = this.region_margin;

            renderer.gl.bindBuffer(34962, lreg.buffer);
            renderer.gl.vertexAttribPointer(0, 3, 5126, false, 12, 0);

            uni = shader.uniforms["reg_pos"]; uni.params[uni.params_length] = reg_pos; uni.func.apply(shader.gl, uni.params);

            this.on_region_render(lreg, renderer, shader);

            if (this.wireframe) {
              uni = shader.uniforms["land_color"];
      if (uni) {
        uni.params[uni.params_length] = this.wire_color;
        uni.func.apply(shader.gl, uni.params);
      }
              renderer.gl.drawElements(1, lreg.di * 2, 5125, (lreg.ds * 2) * 4);
            }


            if (this.shaded) {

              if (reg.smap) {
                renderer.use_texture(reg.smap, 2);

              }
              else {
                renderer.use_texture(renderer.default_texture, 2);
              }
             
              uni = shader.uniforms["land_color"];
      if (uni) {
        uni.params[uni.params_length] = this.shaded_color;
        uni.func.apply(shader.gl, uni.params);
      }
              renderer.gl.drawArrays(4, lreg.ds, lreg.di);
            }

            this.rendered_regions++;
          }

        }
        this.render_time = Date.now() - this.time_start;






      }
    })();


    function ge_terrain_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);
      this.geometry = ge.geometry.geometry_data.create({ vertices: new Float32Array(0) });
      this.material = def.material || (new ge.terrain.material());
      this.processor = def.processor;
      this.regions = {};

      this.processor.add_host(this);


      this.camera_version = -121;

      this.terrian_scale = math.vec3(def.terrian_scale);
      this.ri = 0;
      this.rqi = 0;
      this.regions = {};
      this.region_max_tris = 0;
      this.camera_pos_x = Infinity;
      this.camera_pos_z = Infinity;
      this.camera_pos_y = 0;
      this.camera_vel_y = 0;
      this.timer = 0;
      this.terrain_quality = def.terrain_quality || 4;
      this.last_validate_time = 0;
      this.last_updated_time = 0;
      this.fixed_detail = - 1;
      this.region_offset = def.region_offset || 0;
      this.region_margin = def.region_margin || 1;
      this.rendered_regions = 0;
      if (def.fixed_detail !== undefined) {
        this.fixed_detail = def.fixed_detail;
      }
      this.region_distance = def.region_distance || 4;
      this.draw_distance = def.draw_distance || 2000;
      this.quality_distance = def.quality_distance || 1500;
      this.detail_levels = def.detail_levels || [1, 2, 6, 12, 20];

      this.height_on_camera = 0;
      this.time_step_size = def.time_step_size || (1 / 15);

      this.shaded_color = math.vec4(def.shaded_color || [1, 1, 1,1]);
      this.wire_color = math.vec4(def.wire_color || [2.0, 2.0, 2.0,1]);


      this.wireframe = def.wireframe || false;
      this.shaded = true;
      if (def.shaded !== undefined) this.shaded = def.shaded;
      this.regions_to_render = [];
      this.requested_regions = [];

      this.reg_req_flags = 0;


    }

    return ge_terrain_mesh;


  }, ge.geometry.mesh);






  ge.terrain.collision_mesh = ge.define(function (proto, _super) {

   





    proto.on_new_patch = function (patch) {

    }
    proto.on_region_data = (function (_super_func) {
      var x, z, i, pi;

      return function (reg, data, size, detail) {


        var lreg = this.regions[reg.key];

        if (!lreg.patches) {
          lreg.patches = [];
          x = (reg.x - this.processor.region_size_half);
          z = (reg.z - this.processor.region_size_half);

          for (i = 0; i < size; i += 3) {
            pi = data[i + 2];
            if (!lreg.patches[pi]) {
              lreg.patches[pi] = [];
            }
            lreg.patches[pi].push(
              (Math.floor(data[i] % (this.processor.region_size + 1)) * this.mesh_scale),
              data[i + 1] * this.mesh_scale,
              ((Math.floor(data[i] / (this.processor.region_size + 1))) * this.mesh_scale)
            );
          }
          for (i = 0; i < lreg.patches.length; i++)
            this.on_new_patch(lreg.patches[i], x, z);
        }


      }

    })(proto.on_region_data);





   
    function ge_terrain_collision_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);
      this.reg_req_flags = 2;
      this.mesh_scale = 0.9965;
     // this.mesh_scale = 1.0015;
    }

    return ge_terrain_collision_mesh;


  }, ge.terrain.mesh);






  ge.terrain.land_mesh = ge.define(function (proto, _super) {



    proto.update = (function (_super_func) {

      var params = [null, null];

      return function (camera, timer) {
        params[0] = camera;
        params[1] = timer;

        _super_func.apply(this, params);
        this.cm.update(camera, timer);

      }

    })(proto.update);

    function ge_terrain_land_mesh(def) {
      def = def || {};
      def.terrian_scale = [1, 1, 1];
      def.processor = new ge.terrain.processor(def);

      _super.apply(this, [def]);
      this.cm = new ge.terrain.collision_mesh({
        processor: def.processor,
        quality_distance: 2000,
        draw_distance: 7000,
        fixed_detail: 32,
        region_distance: 8,
        terrain_quality: 8,
        wireframe: false,
        shaded: false,
        time_step_size: 1 / 5,
      });

      

    }

    return ge_terrain_land_mesh;


  }, ge.terrain.mesh);






  ge.terrain.patch_mesh = ge.define(function (proto, _super) {

    ge.terrain.patch_material = ge.define(function (proto, _super) {



      function ge_terrain_patch_material(def) {
        def = def || {};
        _super.apply(this, [def]);

        this.flags += 2;
      }


      return ge_terrain_patch_material;


    }, ge.shading.shaded_material);

    var vkey, vindex_width = 1200;

    var vmap = new Uint8Array(0), vdata = new Float32Array(0);

    var patches = {};


    var vindex_width2 = vindex_width / 2;
    var check_vlevel_value = 0, vkey;
    function check_vlevel(x, z) {
      check_vlevel_value = vmap[(z + vindex_width2) * vindex_width + (x + vindex_width2)];
      return check_vlevel_value;
    };

    var region_size = 1024;
    var s = 1;
    while (s <= region_size) {
      patches[s] = { i: 0, list: [] };
      s = s * 2;
    }

    vindex_width = (region_size * 2) + 8;
    vindex_width2 = vindex_width / 2;

    vkey = vindex_width * vindex_width;
    if (vmap.length < vkey) {
      vmap = new Uint8Array(vkey)
      vdata = new Float32Array(vkey * 4);
    }

    function set_vlevel(x, z, l) {
      vkey = (z + vindex_width2) * vindex_width + (x + vindex_width2);
      vmap[vkey] = Math.min(vmap[vkey], l);
    }

    var output = new Float32Array(100000 * 6), oi = 0, qii = 0;

    var hh0, hh1, hh2, hh3, hh4;
    var hdata, data_size, data_size2;
    var MIN_PATCH_SIZE = 4;
    var PATCH_SIZE = 16;
    var MIN_FAN_DETAIL = 4;
    function H(xp, zp) {
      return hdata[zp * data_size + xp];
    }

    ;


    var draw_fan = (function () {

      var fi = 0, lfx, lfz, fx, fz;

      var fan = [
        -1, 1, -0.75, 1, -0.5, 1, -0.25, 1, 0, 1, 0.25, 1, 0.5, 1, 0.75, 1, 1, 1,
        1, 0.75, 1, 0.5, 1, 0.25, 1, 0, 1, -0.25, 1, -0.5, 1, -0.75, 1, -1,
        0.75, -1, 0.5, -1, 0.25, -1, 0, -1, -0.25, -1, -0.5, -1, -0.75, -1, -1, -1,
        -1, -0.75, -1, -0.5, -1, -0.25, -1, 0, -1, 0.25, -1, 0.5, -1, 0.75, -1, 1
      ];

      var skip_edge_check = [];
      skip_edge_check[16] = true; skip_edge_check[32] = true; skip_edge_check[48] = true; skip_edge_check[64] = true;

      var fan_len = fan.length;
      return function (x, z, s, fd) {
        lfx = fan[0];
        lfz = fan[1];
        fi = fd;
        while (fi < fan_len) {
          fx = fan[fi]; fz = fan[fi + 1];

          check_vlevel_value = vmap[((z + fz * s) + vindex_width2) * vindex_width + ((x + fx * s) + vindex_width2)];
          if (skip_edge_check[fi] || check_vlevel_value < s) {
            vkey = (z + vindex_width2) * vindex_width + (x + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x;
      output[oi + 2] = z;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z + lfz * s + vindex_width2) * vindex_width + (x + lfx * s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x + lfx * s;
      output[oi + 2] = z + lfz * s;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z + fz * s + vindex_width2) * vindex_width + (x + fx * s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x + fx * s;
      output[oi + 2] = z + fz * s;
      output[oi + 3] = patch_index;
      oi += 6;
            lfx = fx; lfz = fz;
          }
          fi += fd;
        }
      }
    })();


    function eval_area_height(x, z, s, pndx, slot) {

      hh0 = H(x, z);
      hh1 = H(x - s, z - s);
      hh2 = H(x + s, z - s);
      hh3 = H(x + s, z + s);
      hh4 = H(x - s, z + s);


      var indx = qii;

      output[indx] = Math.max(
        Math.abs(((hh1 + hh2) * 0.5) - hh0), Math.abs(((hh4 + hh3) * 0.5) - hh0), Math.abs(((hh1 + hh4) * 0.5) - hh0), Math.abs(((hh2 + hh3) * 0.5) - hh0)
      );

      if (pndx > -1) {
        output[pndx + slot] = indx;
      }

      if (s > MIN_PATCH_SIZE) {
        qii += 5;
        s *= 0.5;
        output[indx] = Math.max(
          output[indx],
          eval_area_height(x - s, z - s, s, indx, 1),
          eval_area_height(x + s, z - s, s, indx, 2),
          eval_area_height(x - s, z + s, s, indx, 3),
          eval_area_height(x + s, z + s, s, indx, 4));
      }

      return output[indx];
    }

    var _RSK = new Float32Array(1024), _si = 0, i = 0;
    var dd = 0, dlen = 0;
    function rasterize_patch(x, z, s, detail, rg_QT) {
      _si = 0;
      var i = 0;
      _RSK[_si] = x; _RSK[_si + 1] = z; _RSK[_si + 2] = s; _RSK[_si + 3] = i; _si += 4;

      while (_si > 0) {
        _si -= 4;
        x = _RSK[_si]; z = _RSK[_si + 1]; s = _RSK[_si + 2]; i = _RSK[_si + 3];
        dd = detail;

        if (s > PATCH_SIZE || (s >MIN_PATCH_SIZE && rg_QT[i] > dd)) {
          s *= 0.5;
          _RSK[_si] = x + s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 4]; _si += 4;
          _RSK[_si] = x - s; _RSK[_si + 1] = z + s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 3]; _si += 4;
          _RSK[_si] = x + s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 2]; _si += 4;
          _RSK[_si] = x - s; _RSK[_si + 1] = z - s; _RSK[_si + 2] = s; _RSK[_si + 3] = rg_QT[i + 1]; _si += 4;
        }
        else {
          p = patches[s];
          p.list[p.i++] = x;
          p.list[p.i++] = z;
        }
      }
    }

    var patch_index = 0;
    var check_for_edge_cases = true;
    var check_edge_cases=false;
    function render_patches() {
      s = MIN_PATCH_SIZE;
      check_edge_cases = false;
      patch_index = 0;
      while (s <= PATCH_SIZE) {
        p = patches[s];

        i = 0;
        j = p.i;
        while (i < j) {

          x = p.list[i++];
          z = p.list[i++];
          fd = 16;

          if (check_for_edge_cases) {
            if (s >= MIN_PATCH_SIZE ) {
              check_edge_cases = false;

              if (check_vlevel(x - s, z) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x + s, z) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x, z - s) < s) {
                check_edge_cases = true;
              }
              else if (check_vlevel(x, z + s) < s) {
                check_edge_cases = true;
              }


              if (check_edge_cases) {

                fd = (s / check_vlevel_value);
                if (fd < 16) {
                  fd = Math.max(2, 8 / fd);
                }
                else fd = 2;

                fd = Math.min(MIN_FAN_DETAIL, fd);
                
              }
             
            }

          }

          if (check_for_edge_cases) {
            draw_fan(x, z, s, fd);
          }
          else {
            vkey = (z - s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x - s;
      output[oi + 2] = z - s;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z - s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x + s;
      output[oi + 2] = z - s;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z + s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x + s;
      output[oi + 2] = z + s;
      output[oi + 3] = patch_index;
      oi += 6;
            vkey = (z - s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x - s;
      output[oi + 2] = z - s;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z + s + vindex_width2) * vindex_width + (x + s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x + s;
      output[oi + 2] = z + s;
      output[oi + 3] = patch_index;
      oi += 6;

      vkey = (z + s + vindex_width2) * vindex_width + (x - s + vindex_width2);
              vmap[vkey] = Math.min(vmap[vkey], s);
      output[oi] = x - s;
      output[oi + 2] = z + s;
      output[oi + 3] = patch_index;
      oi += 6;
          }
          patch_index++;
        }
        s = s * 2;
      }

    }


    function calculate_output_data(is, ie, xo, zo, sc) {
      i = is;
      s = PATCH_SIZE;
      while (i < ie) {
        x = output[i]
        z = output[i + 2];
        _xx = (x * sc) + xo;
        _zz = (z * sc) + zo;
        vkey = (_zz + vindex_width2) * vindex_width + (_xx + vindex_width2);
        if (vmap[vkey] !== 222) {
          vmap[vkey] = 222;
          vkey *= 4;
          vdata[vkey] = H(x, z);

          nx = (H(x - s, z) - H(x + s, z));
          ny = (s * 2);
          nz = (H(x, z - s) - H(x, z + s));

          _fp = nx * nx + ny * ny + nz * nz;
          if (_fp > 0) _fp = 1 / Math.sqrt(_fp);

        //  nx = (((nx * _fp) + 1) * 0.5) * 1;
         // ny = (((ny * _fp) + 1) * 0.5) * 1;
        //  nz = (((nz * _fp) + 1) * 0.5) * 1;
          nx *= _fp;
          ny *= _fp;
          nz *= _fp;



          vdata[vkey + 1] = nx;
          vdata[vkey + 2] = ny;
          vdata[vkey + 3] = nz;
        }
        else {
          vkey *= 4;
        }

        output[i + 1] = vdata[vkey];
        output[i + 3] = vdata[vkey + 1];
        output[i + 4] = vdata[vkey + 2];
        output[i + 5] = vdata[vkey + 3];


        output[i] = _xx;
        output[i + 2] = _zz;



        i += 6;
      }




    }


    function ge_terrain_patch_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);

      this.geometry = new ge.geometry.geometry_data();


      this.position = this.geometry.add_attribute("a_position_rw", {
        item_size: 3, data: new Float32Array(0), stride: 8 * 4
      });
      
      this.geometry.add_attribute("a_normal_rw", {
        item_size: 3, stride: 8 * 4, offset: 3 * 4,
      });

      this.geometry.add_attribute("a_uv_rw", {
        item_size: 2, stride: 8 * 4, offset: 6 * 4,
      });
      

      this.material = def.material || (new ge.terrain.patch_material());



      var self = this;
      var divisor = def.divisor || 1;
      ge.load_working_image_data(def.url, function (image_data, width, height) {
        self.hdata = new Float32Array((def.size + 1) * (def.size + 1));
        for (var i = 0; i < image_data.length / 4; i++) {
          self.hdata[i] = image_data[i * 4] / divisor;
        }
        self.data_size = def.size;
        hdata = self.hdata;
        data_size = self.data_size;
        data_size2 = data_size / 2;

        qii = 0;
        eval_area_height(data_size2, data_size2, data_size2, -1, 0);

        self.QT = new Float32Array(qii);
        var i = 0;
       
        while (i < qii) { self.QT[i] = output[i++]; }
        oi = 0;
        vmap.fill(255);
        output.fill(0);

        rasterize_patch(data_size2, data_size2, data_size2, def.details, self.QT);
        render_patches();

        calculate_output_data(0, oi, 0, 0, 1);

        self.position.data = new Float32Array((oi / 6) * 8);

        var ii = 0;
        for (i = 0; i < oi; i += 6) {
          self.position.data[ii] = output[i];
          self.position.data[ii+1] = output[i+1];
          self.position.data[ii+2] = output[i+2];
          self.position.data[ii+3] = output[i+3];
          self.position.data[ii + 4] = output[i + 4];
          self.position.data[ii + 5] = output[i + 5];

          self.position.data[ii + 6] = self.position.data[ii]/ data_size;
          self.position.data[ii + 7] = self.position.data[ii+2] / data_size;

          ii += 8;
        }
        self.draw_count = ii/8;
        self.position.data_length = ii;
        self.position.needs_update = true;
        console.log(output);
        console.log(self);

      }, def.size, def.size);
    }

    return ge_terrain_patch_mesh;


  }, ge.geometry.mesh);
 
}})()(_FM["ecs"],_FM["ge"],_FM["math"]);
(function() { return function render_system(fin, ge, ecs, math ) { 

  ecs.register_component('ge_renderable', fin.define(function (proto, _super) {

    proto.set_layer = function (layer) {
      layer = Math.pow(2, layer);
      if (!(this.layers & layer)) {
        this.layers |= layer;
      }
      return (this);
    };

    proto.unset_layer = function (layer) {
      layer = Math.pow(2, layer);
      if ((this.layers & layer) !== 0) {
        this.layers &= ~layer;
      }
      return (this);
    };

    proto.update_bounds = function (mat) { }
    function ge_renderable(def, en, app, comp) {
      this.entity = en;
      this.items = def.items || [];
      this.version = 0;
      this.layers = 0;
      this.set_layer(def.layer || 1);
    }

    ge_renderable.validate = function (comp) {
      comp.app.use_system('ge_render_system');
    };
    return ge_renderable;



  }, ecs.component));


  ecs.register_component('ge_update', fin.define(function (proto, _super) {



    function ge_update(def, en, app, comp) {
      this.before_update = def.before_update;
      this.after_update = def.after_update;


    }

    ge_update.validate = function (comp) {
      comp.app.use_system('ge_render_system');
    };
    return ge_update;



  }, ecs.component));


  ecs.register_component('drage_points', fin.define(function (proto, _super) {

    var g = ge.geometry.shapes.sphere({rad:0.5});
    var mat = new ge.shading.material({
      ambient: [0.9, 0.9, 0.9], transparent: 0.4,
      transparent_layer: 1000,
      no_depth_test: true });

    proto.add_point = function (trans) {
      var m = new ge.geometry.mesh({
        geometry: g,
        material: mat,
        
        flags: 2 + 2048
      });
      m.trans = trans;
      this.items.push(m);
    };

    function drage_points(def, en, app, comp) {     
      _super.apply(this, arguments);
      if (def.points) {
        def.points.forEach(this.add_point);
      }

    }

    drage_points.validate = function (comp) {

      var sys = comp.app.use_system('ge_render_system');
      var camera = sys.camera.ge_camera;

      var dmesh;
      camera.on_drage.add(function (dx, dy) {
        if (camera.is_locked) {
          dmesh.trans.sys.drage_to_direction(dmesh.trans, camera.drag_direction,
            Math.sqrt(dx * dx + dy * dy) * 0.065);

        }


      });
      sys.on_mesh_picked.add(function (m) {
        camera.is_locked = true;
        dmesh = m;

      });




    };
    return drage_points;



  }, ecs.components['ge_renderable']));

  

  ecs.register_system('ge_render_system', fin.define(function (proto, _super) {


    function transparent_meshes_sort(a, b) {
      return (a.view_position[2] + a.transparent_layer) - (b.view_position[2] + b.transparent_layer);
    }

    function meshes_sort(a, b) {
      a.suid = a.material.shader.uuid;
      b.suid = b.material.shader.uuid;
      return a.material.shader.uuid - b.material.shader.uuid;
    }





    var mm_mesh = {
      mesh: null,
      material: null
    };
    proto.step = function () {

      if (this.app.timer - this.fps_timer > 1) {
        this.fps = this.fps_counter;
        this.fps_timer = this.app.timer - ((this.app.timer - this.fps_timer) % this.step_size);
        this.fps_counter = 0;
      }
      this.fps_counter++;

      var entity, trans, item, comp, renderable, i = 0,ei;
      var camera = this.camera.ge_camera, process_list = false;



      if ((this.camera_version !== camera.version) || (this.app.timer - this.list_refereshed_timer) > (this.step_size * 4)) {


        process_list = true;
        this.meshes.length = 0;
        this.lights.length = 0;

        this.list_refereshed_timer = this.app.timer;
        this.camera_version = camera.version;

        
      }
      var fmi = 0, omi = 0, tmi = 0, mmi = 0;
      if (process_list) {
        for (mmi = 0; mmi < this.multi_material_meshes.length; mmi++) {
          this.multi_material_meshes.pool.free(this.multi_material_meshes.data[mmi]);
        }
        this.multi_material_meshes.clear();
      }
      
      while ((entity = this.app.iterate_entities("ge_update")) !== null) {
        if (entity.ge_update.before_update) {
          entity.ge_update.before_update(this.app.timer);
        }
      }

      /*
      while ((entity = this.app.iterate_entities("drage_points")) !== null) {
        renderable = entity.drage_points;
        for (i = 0; i < renderable.items.length; i++) {
          item = renderable.items[i];
          if (item.trans.updated) {
            item.update_world_transform(item.trans.pos, item.trans.scale, item.trans.rot);
            item.update_bounds(item.matrix_world, item.trans);
            item.require_update = 0;
          }
        }
      }
      */
      comp = this.app.components['ge_renderable'];
      if (comp) {
        ei = comp.entities.length;

        while (--ei > 0) {
          entity = this.app.entities[comp.entities[ei]];

          renderable = entity[comp.ins_map[ei]];
          trans = entity.transform;


          for (i = 0; i < renderable.items.length; i++) {
            item = renderable.items[i];
            if (item.trans) {
              trans = item.trans;

            }
            if (trans.updated || item.require_update !== 0) {

              item.update_world_transform(trans.pos, trans.scale, trans.rot)

              item.version = ((item.version | 0) + 1) % (99999 | 0);
              item.update_bounds(item.matrix_world, trans);
              if (item.item_type === 1024) {
                item.initialize_item();
              }

              item.require_update = 0;
            }
            if (process_list) {
              if (item.render_list) {
                item.render_list();
              }
              if (item.item_type === 4 && (item.flags & 2 || item.material.flags & 2)) {
                if (item.has_multi_materials) {
                  for (mmi = 0; mmi < item.material.length; mmi++) {
                    mm_mesh.mesh = item;
                    mm_mesh.material = item.material[mmi];
                    this.meshes[omi++] = this.multi_material_meshes.pool.get(mm_mesh);
                  }
                }
                else {
                  this.meshes[omi++] = item;
                }



              }
              else if (item.item_type === 8 && (item.flags & 2)) {
                if (item.enabled) this.lights[fmi++] = item;
              }
              else if (item.bounds) {

                if (camera.aabb_aabb(item.bounds)) {
                  if (camera.frustum_aabb(item.bounds)) {

                    math.vec3.transform_mat4(item.view_position, item.world_position, camera.view_inverse);


                    if (item.item_type === 4) {
                      if (item.has_multi_materials) {
                        for (mmi = 0; mmi < item.material.length; mmi++) {
                          mm_mesh.mesh = item;
                          mm_mesh.material = item.material[mmi];
                          this.meshes[omi++] = this.multi_material_meshes.pool.get(mm_mesh);
                        }
                      }
                      else {
                        this.meshes[omi++] = item;
                      }

                    }
                    else if (item.item_type === 8) {

                      if (item.enabled) this.lights[fmi++] = item;
                    }
                  }
                }
              }
            }



            renderable.version = ((renderable.version | 0) + 1) % (99999 | 0);

          }

        }
      }



      while ((entity = this.app.iterate_entities("ge_update")) !== null) {
        if (entity.ge_update.after_update) {
          entity.ge_update.after_update(this.app.timer);
        }
      }

     


      if (!this.renderer_ready) {
       
        return;

      }


      if (process_list) {

        if (this.meshes.length > 0) {
          fin.merge_sort(this.meshes, this.meshes.length, meshes_sort);
        }

        this.flat_meshes.length = 0;
        this.opuque_meshes.length = 0;
        this.transparent_meshes.length = 0;

        fmi = 0; omi = 0; tmi = 0;

        this.pickable_meshes.length = 0;
        i = this.meshes.length;
        while (--i > -1) {
          item = this.meshes[i];
          if ((item.material.flags & 128)) {
            item.transparent_layer = item.material.transparent_layer * 100000;
            this.transparent_meshes[tmi++] = item;
          }
          else {
            if (item.material.flags & 2) {
              this.flat_meshes[fmi++] = item;
            }
            else {
              this.opuque_meshes[omi++] = item;
            }
          }
          
          if (this.picking_mouse_x > -1) {
         
            if (item.flags & 2048) {
              
              this.pickable_meshes[this.pickable_meshes.length] = item;

            }
          }
        }
        if (this.transparent_meshes.length > 0) {
          fin.merge_sort(this.transparent_meshes, this.transparent_meshes.length, transparent_meshes_sort);
        }



      }
      i = this.meshes.length;


     

      this.status_text = i + " meshes";
     

      this.renderer.timer = this.app.timer;
      this.renderer.render_scene(camera, this.flat_meshes, this.opuque_meshes, this.transparent_meshes, this.lights);
      if (this.pickable_meshes.length > 0) {
        this.process_pickable_meshes();
      }
      else {
        //this.picking_mouse_x = -1;
      }


     
     

    }


    proto.resize = function () {
      var rect = this.host.getBoundingClientRect();
      this.renderer.set_canvas_size(rect.width, rect.height);
      this.camera.ge_camera.update_aspect(rect.width / rect.height);
    }

    proto.setup_host = function (host) {
      this.host = host;
      this.host.appendChild(this.renderer.canvas);
      setTimeout(function (self) {
        self.resize();
        self.renderer_ready = true;
      }, 50, this);

    }


    proto.process_pickable_meshes = (function () {
      var uint32_color_id = new Uint32Array(1);
      var byte_id = new Uint8Array(uint32_color_id.buffer);
      var u_color_id_rw = new Float32Array(4);

     

      

      proto.new_pick_color_id = function () {
        uint32_color_id[0] = this.picking_color_id;
        byte_id[3] = 255;
        u_color_id_rw[0] = byte_id[0];
        u_color_id_rw[1] = byte_id[1];
        u_color_id_rw[2] = byte_id[2];
        u_color_id_rw[3] = byte_id[3];
        uni = shader.uniforms["u_color_id_rw"]; uni.params[uni.params_length] = u_color_id_rw; uni.func.apply(shader.gl, uni.params);
        this.picking_color_id += 1024;
        return uint32_color_id[0];
      };


      var pickable_shader = "<?=chunk('precision')?>\nuniform vec4 u_color_id_rw;\nvoid fragment(void) {\ngl_FragColor=u_color_id_rw/255.0;\n}";


      return function () {
       
          var renderer = this.renderer, shader, mesh, uni, i = 0;
          var camera = renderer.active_camera;

          if (renderer.render_target2.bind()) {
            renderer.gl.clear(16384);
          }
          renderer.gl_depthFunc(514);
          for (i = 0; i < this.pickable_meshes.length; i++) {
            mesh = this.pickable_meshes[i];

            if (!mesh.material.shader.pickable) {
              mesh.material.shader.pickable = mesh.material.shader.extend(pickable_shader, { fragment: false });
            }
            if (renderer.use_shader(mesh.material.shader.pickable)) {
              shader = renderer.active_shader;
              if (shader.camera_version !== camera.version) {
        shader.camera_version = camera.version;
        uni = shader.uniforms["u_view_projection_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_projection;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_rw"];
      if (uni) {
        uni.params[uni.params_length] = camera.view_inverse;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_fw"];
      if (uni) {
        uni.params[uni.params_length] = camera.fw_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_sd"];
      if (uni) {
        uni.params[uni.params_length] = camera.sd_vector;
        uni.func.apply(shader.gl, uni.params);
      }
        uni = shader.uniforms["u_view_up"];
      if (uni) {
        uni.params[uni.params_length] = camera.up_vector;
        uni.func.apply(shader.gl, uni.params);
      }
      }
            }

            if (!mesh.picking_color_id) {
              uint32_color_id[0] = this.picking_color_id;
        byte_id[3] = 255;
        u_color_id_rw[0] = byte_id[0];
        u_color_id_rw[1] = byte_id[1];
        u_color_id_rw[2] = byte_id[2];
        u_color_id_rw[3] = byte_id[3];
        uni = shader.uniforms["u_color_id_rw"]; uni.params[uni.params_length] = u_color_id_rw; uni.func.apply(shader.gl, uni.params);
              mesh.picking_color_id = uint32_color_id[0];
              this.picking_color_id += 1024;
            }
            else {
              uint32_color_id[0] = mesh.picking_color_id;
        byte_id[3] = 255;
        u_color_id_rw[0] = byte_id[0];
        u_color_id_rw[1] = byte_id[1];
        u_color_id_rw[2] = byte_id[2];
        u_color_id_rw[3] = byte_id[3];
        uni = shader.uniforms["u_color_id_rw"]; uni.params[uni.params_length] = u_color_id_rw; uni.func.apply(shader.gl, uni.params);
              mesh.picking_color_id = uint32_color_id[0];
            }

            uni = shader.uniforms["u_model_rw"]; uni.params[uni.params_length] = mesh.matrix_world; uni.func.apply(shader.gl, uni.params);
            renderer.use_geometry(mesh.geometry);
      mesh.material.render_mesh(renderer, shader, mesh);
          }
          renderer.gl_depthFunc(513);


          if (this.picking_mouse_x > -1) {
            this.picking_mouse_x *= renderer.pixel_ratio;
            this.picking_mouse_y *= renderer.pixel_ratio;
            this.picking_mouse_y = renderer.render_height - this.picking_mouse_y;


            renderer.gl.readPixels(this.picking_mouse_x, this.picking_mouse_y, 1, 1, 6408, 5121, byte_id);
            var picked_id = uint32_color_id[0];

            this.picking_mouse_x = -1;
            this.picking_mouse_y = -1;

            this.picked_mesh = null;
            for (i = 0; i < this.pickable_meshes.length; i++) {
              mesh = this.pickable_meshes[i];
              mesh.is_picked = false;
              this.picked_mesh = mesh;
              if (mesh.picking_color_id === picked_id) {
                this.on_mesh_picked.params[0] = mesh;
                mesh.is_picked = true;
                this.on_mesh_picked.trigger_params();
                break;
              }
            }

          }
          
      }
    })();

    proto.camera_state = function () {
      var camera = this.camera;
      (function () {
        camera.set_position({
          pos: [-14.41160, 5.617, 16.553],
          eular: [-0.255185, 11.874, 0]
        });

        document.onmouseup = function () {
          window.localStorage.setItem('cam', JSON.stringify(camera.get_position()));

        }

        if (window.localStorage.getItem("cam")) {
          camera.set_position(JSON.parse(window.localStorage.getItem("cam")));
        }

      })()
    }

    function ge_render_system(def) {
      _super.apply(this, arguments);      
      this.priority = 10000;
      this.renderer = new ge.renderer(def.renderer);
      var self = this;

      this.scene_render = new ge.event(this);
      this.renderer.clear_screen = (function (_super) {


        return function () {

          _super.apply(this);
          self.scene_render.trigger_params();
          return this;
        }
      })(this.renderer.clear_screen);

      this.renderer_ready = false;
      console.log("ge_render_system", this);
     
      this.lights = [];
      this.meshes = [];

      this.flat_meshes = [];
      this.opuque_meshes = [];
      this.transparent_meshes = [];
      this.camera_version = -1;
      this.list_refereshed_timer = 0;
      this.fps_counter = 0;
      this.fps_timer = 0;
      this.fps = 0;
      this.pickable_meshes = [];

      this.picking_color_id = 1024 * 4;

      this.picking_mouse_x = -1;
      this.picking_mouse_y = -1;

      this.on_mesh_picked = new ge.event(this, [null]);

     


      
      self.multi_material_meshes = new ge.array();

      self.multi_material_meshes.pool = new fin.object_pooler_ext(function () {
        return {};
      },
        function (mesh, mm_mesh) {
          mesh.user_data = mm_mesh.mesh.user_data;
          mesh.material = mm_mesh.material;
          mesh.matrix_world = mm_mesh.mesh.matrix_world;
          mesh.world_position = mm_mesh.mesh.world_position;
          mesh.bounds_sphere = mm_mesh.mesh.bounds_sphere;
          mesh.flags = mm_mesh.mesh.flags;
          mesh.geometry = mm_mesh.mesh.geometry;
          mesh.view_position = mm_mesh.mesh.view_position;
          mesh.draw_offset = mm_mesh.mesh.draw_offset;
          mesh.draw_count = mm_mesh.mesh.draw_count;

          self.multi_material_meshes.push(mesh);
          return mesh;
        }
      );

      this.multi_material_meshes.pool.on_free = function (mesh) {
        mesh.user_data = undefined;
        mesh.material = undefined;
        mesh.matrix_world = undefined;
        mesh.world_position = undefined;
        mesh.bounds_sphere = 0;
        mesh.flags = 0;
        mesh.geometry = undefined;
        mesh.view_position = undefined;
        mesh.draw_offset = undefined;
        mesh.draw_count = undefined;
      }

      this.camera = def.camera || this.app.create_entity({
        components: {
          'transform': {},         
          'ge_camera': {},
        }
      });

      this.camera.set_position = function (def) {
        math.vec3.copy(self.camera.ge_camera.eular, def.eular);
       
        self.camera.transform.set_pos(def.pos[0], def.pos[1], def.pos[2])
          .set_eular(def.eular[0], def.eular[1], def.eular[2]);
      };

      this.camera.get_position = function () {
        return {
          pos: self.camera.transform.pos,
          eular: self.camera.ge_camera.eular
        }
      };
      this.setup_host(def.host);
     

     



      
    }




    return ge_render_system;



  }, ecs.system));



}})()(_FM["fin"],_FM["ge"],_FM["ecs"],_FM["math"]);
(function() { return function active_mesh(ge, math) {

  ge.active_mesh = ge.define(function (proto, _super) {

    var temp_quat = math.quat(), temp_vec3 = math.vec3();
    
    proto.update_world_transform = function (position_world, scale_world, rotation_world) {

      math.quat.mult(temp_quat, rotation_world, this.rotation)
      math.mat4.from_quat(this.matrix_world, temp_quat);

      temp_vec3[0] = scale_world[0] * this.scale[0];
      temp_vec3[1] = scale_world[1] * this.scale[1];
      temp_vec3[2] = scale_world[2] * this.scale[2];

      math.mat4.scale(this.matrix_world, temp_vec3);

      this.matrix_world[12] = position_world[0] + this.position[0];
      this.matrix_world[13] = position_world[1] + this.position[1];
      this.matrix_world[14] = position_world[2] + this.position[2];


    };

    function ge_active_mesh(def) {
      def = def || {};
      _super.apply(this, [def]);

      this.position = math.vec3(def.position);
      this.scale = math.vec3(def.scale || [1, 1, 1]);
      this.rotation = math.quat(def.rotation);

      if (def.rotate) {
        math.quat.rotate_eular(this.rotation, def.rotate[0], def.rotate[1], def.rotate[2]);

      }

    }



    return ge_active_mesh;
  }, ge.geometry.mesh);




}})()(_FM["ge"],_FM["math"]);
(function() { return function skeleton_system(fin, ge, ecs, math) {
  ecs.register_component('bones_skeleton', fin.define(function (proto, _super) {
    function bones_skeleton(def, en, app, comp) {
      return app.use_system('bones_system').create_skeleton(def, en.transform);
    }

    bones_skeleton.is_functional = true;

    bones_skeleton.validate = function (comp) {


    };
    return bones_skeleton;



  }, ecs.component));
  
  ecs.register_system('bones_system', fin.define(function (proto, _super) {


    var skeleton_object = fin.define(function (proto) {


      proto.get_skeleton_mesh = function () {

        return this.sys.get_skeleton_mesh(this);
      };




      return function skeleton_object(sys) {
        this.sys = sys;
        this.bones = [];
      }


    });


    proto.step = function () {

    }

    proto.get_skeleton_mesh = (function () {
      var geo = ge.geometry.shapes.cube({ width: 3, depth: 3 });

      for (i = 0; i < geo.attributes.a_position_rw.data.length; i += 3) {
        if (geo.attributes.a_position_rw.data[i + 1] > 0.3) {
          geo.attributes.a_position_rw.data[i] *= 0.15;
          geo.attributes.a_position_rw.data[i + 2] *= 0.15;
        }

      }
      geo.scale_position_rotation(0.1, 1, 0.1, 0, 0.5, 0, 0, 0, 0);


      var mat = new ge.shading.shaded_material({
        ambient: [1, 0, 0], wireframe1: true, cast_shadows: true,
      });


      mat.shader = mat.shader.extend(`

uniform vec4 u_bone_qr;
uniform vec3 u_bone_start;
uniform vec3 u_bone_end;
<?=chunk('quat-dquat')?>

void vertex(){
  super_vertex();
   v_position_rw=vec4(a_position_rw,1.0);
  float len=length((u_bone_end-u_bone_start));
  v_position_rw.xz*=min(len,1.0);
  v_position_rw.y*=len;
  v_position_rw.xyz=quat_transform(u_bone_qr,v_position_rw.xyz);
  v_position_rw.xyz+=u_bone_start;
  gl_Position=u_view_projection_rw*(u_model_rw*v_position_rw);

}

`);


      var S6$dquat1,S6$ax0,S6$ay0,S6$az0,S6$bx0,S6$by0,S6$bz0,S6$bw0,S6$dquat2,S6$dquat3,S6$aw0,S6$ax1,S6$ay1,S6$az1,S6$aw1,S6$bx1,S6$by1,S6$bz1,S6$bw1;
      var i, bnn, pbnn, ske;



      mat.complete_render_mesh = function (renderer, shader, mesh) {

      
        ske = mesh.user_data.ske;

        for (i = 0; i < ske.bones.length; i++) {
          bnn = ske.bones[i];

          if (bnn.parent) {
            pbnn =bnn.parent;
           
            shader.set_uniform("u_bone_end", bnn.trans.pos);
            shader.set_uniform("u_bone_start", pbnn.trans.pos);
            shader.set_uniform("u_bone_qr", pbnn.trans.rot);

            renderer.gl.drawElements(this.final_draw_type, this.final_draw_count, 5125, 0);

          }

        }
      }


      return function (ske) {
        var mesh = new ge.geometry.mesh({
          geometry: geo,
          material: mat,
          flags: 2
        });
        mesh.user_data.ske = ske;
        console.log(mesh);
        return mesh;

      }

    })();

    var bind_pos = [], bone_bind = new Float32Array(8);
    proto.create_skeleton = function (def,ptrans) {
      var self = this;
      var ske = new skeleton_object(this);
      var bone, trans;
      var trans_sys = self.app.use_system('transform_system');
      def.bones.forEach(function (b, i) {

        

        if (def.pre_scale) {
          math.vec3.multiply(b.pos, b.pos, def.pre_scale);
        }
        trans = trans_sys.create_transform(b);
        bone = self.bones.pool.get(trans.id);

        bone.trans = trans;
        ske.bones[i] = bone;

        if (b.pn) {
          bone.parent = ske.bones[ske[b.pn]];
          trans_sys.set_parent(bone.trans, bone.parent.trans);
        }
        else {
          trans_sys.set_parent(bone.trans,ptrans);
        }
        ske[b.name] = i;


        bone_bind.fill(0);
        bone_bind[3] = 1;
        if (b.bind_pos && b.bind_pos.length === 16) {
          
          math.mat4.copy(bind_pos, b.bind_pos);
          if (def.pre_scale) {
            bind_pos[12] *= def.pre_scale[0];
            bind_pos[13] *= def.pre_scale[1];
            bind_pos[14] *= def.pre_scale[2];
          }
          math.dquat.from_mat4(bone_bind, bind_pos);

         // math.dquat.invert(bone.bind, bone.bind);


        }




        self.set_bone(bone, bone_bind);

      });

      if (def.ik) {
        var nodes = [], t;
        def.ik.forEach(function (ik) {
          nodes.length = 0;
          
          ik.forEach(function (n) {
            if (!fin.is_string(n)) {
              t = trans_sys.create_transform(n);
              t.set_parent(ptrans);
              nodes.push(t.id);
              if (n.name) ske[n.name] = t;
            }
            else {
              t = ske.bones[ske[n]];
              if (t) {
                nodes.push(t.trans.id);
              }
            }

          });
          self.set_ik(nodes);

        });
      }

      return ske;
    }

    proto.validate = function (app) {
      this.priority = app.use_system('transform_system').priority + 100;

    };

    function worker_script(bones_sys) {
      bones_sys.bones = { list: [] };
      var bone, tid, trans, bi;

      //set bone
      bones_sys.commands[5000] = function (dt, ci) {
        tid = dt[ci++];
        trans = bones_sys.transforms[tid];
        bone = bones_sys.bones[tid];

        if (bone === undefined) {
          bone = {
            trans: trans,
            bind: new Float32Array(8),
          };
          bones_sys.bones.list.push(bone);
        }

        bones_sys.bones[tid] = bone;

        bone.bind[0] = dt[ci++];
        bone.bind[1] = dt[ci++];
        bone.bind[2] = dt[ci++];
        bone.bind[3] = dt[ci++];
        bone.bind[4] = dt[ci++];
        bone.bind[5] = dt[ci++];
        bone.bind[6] = dt[ci++];
        bone.bind[7] = dt[ci++];


      }


      bones_sys.ske_ik_chains = [];


      var S5$xUnitVec3,S5$yUnitVec3,S5$tmpvec3,S5$dot,S5$qX,S5$qY,S5$qZ,S5$qW,S5$qLen,S5$quat1,S5$quat2,S5$quat3,S5$scale0,S5$scale1,S5$dqX,S5$dqY,S5$dqZ,S5$dqW;
      var S6$dquat1,S6$ax0,S6$ay0,S6$az0,S6$bx0,S6$by0,S6$bz0,S6$bw0,S6$dquat2,S6$dquat3,S6$aw0,S6$ax1,S6$ay1,S6$az1,S6$aw1,S6$bx1,S6$by1,S6$bz1,S6$bw1;


      var temp_dquat = [], dq = [], rot, pos;


      bones_sys.add_output(1010101, function (dt, oi) {

        for (bi = 0; bi < bones_sys.bones.list.length; bi++) {
          bone = bones_sys.bones.list[bi];

          if (bone.trans.update) {

            rot = bone.trans.world_rot;
            pos = bone.trans.world_pos;

            S6$dquat1 = temp_dquat;

      S6$dquat1[0] = rot[0];
      S6$dquat1[1] = rot[1];
      S6$dquat1[2] = rot[2];
      S6$dquat1[3] = rot[3];

      S6$ax0 = pos[0] * 0.5;
      S6$ay0 = pos[1] * 0.5;
      S6$az0 = pos[2] * 0.5;



      S6$bx0 = S6$dquat1[0];
      S6$by0 = S6$dquat1[1];
      S6$bz0 = S6$dquat1[2];
      S6$bw0 = S6$dquat1[3];



      S6$dquat1[4] = S6$ax0 * S6$bw0 + S6$ay0 * S6$bz0 - S6$az0 * S6$by0;
      S6$dquat1[5] = S6$ay0 * S6$bw0 + S6$az0 * S6$bx0 - S6$ax0 * S6$bz0;
      S6$dquat1[6] = S6$az0 * S6$bw0 + S6$ax0 * S6$by0 - S6$ay0 * S6$bx0;
      S6$dquat1[7] = -S6$ax0 * S6$bx0 - S6$ay0 * S6$by0 - S6$az0 * S6$bz0;
            S6$dquat1 = dq;
      S6$dquat2 = temp_dquat;
      S6$dquat3 = bone.bind;

      S6$ax0 = S6$dquat2[0]; S6$ay0 = S6$dquat2[1]; S6$az0 = S6$dquat2[2]; S6$aw0 = S6$dquat2[3];
      S6$ax1 = S6$dquat2[4]; S6$ay1 = S6$dquat2[5]; S6$az1 = S6$dquat2[6]; S6$aw1 = S6$dquat2[7];

      S6$bx0 = S6$dquat3[0]; S6$by0 = S6$dquat3[1]; S6$bz0 = S6$dquat3[2]; S6$bw0 = S6$dquat3[3];
      S6$bx1 = S6$dquat3[4]; S6$by1 = S6$dquat3[5]; S6$bz1 = S6$dquat3[6]; S6$bw1 = S6$dquat3[7];

      S6$dquat1[0] = S6$ax0 * S6$bw0 + S6$aw0 * S6$bx0 + S6$ay0 * S6$bz0 - S6$az0 * S6$by0;
      S6$dquat1[1] = S6$ay0 * S6$bw0 + S6$aw0 * S6$by0 + S6$az0 * S6$bx0 - S6$ax0 * S6$bz0;
      S6$dquat1[2] = S6$az0 * S6$bw0 + S6$aw0 * S6$bz0 + S6$ax0 * S6$by0 - S6$ay0 * S6$bx0;
      S6$dquat1[3] = S6$aw0 * S6$bw0 - S6$ax0 * S6$bx0 - S6$ay0 * S6$by0 - S6$az0 * S6$bz0;

      S6$dquat1[4] = S6$ax0 * S6$bw1 + S6$aw0 * S6$bx1 + S6$ay0 * S6$bz1 - S6$az0 * S6$by1 + S6$ax1 * S6$bw0 + S6$aw1 * S6$bx0 + S6$ay1 * S6$bz0 - S6$az1 * S6$by0;
      S6$dquat1[5] = S6$ay0 * S6$bw1 + S6$aw0 * S6$by1 + S6$az0 * S6$bx1 - S6$ax0 * S6$bz1 + S6$ay1 * S6$bw0 + S6$aw1 * S6$by0 + S6$az1 * S6$bx0 - S6$ax1 * S6$bz0;
      S6$dquat1[6] = S6$az0 * S6$bw1 + S6$aw0 * S6$bz1 + S6$ax0 * S6$by1 - S6$ay0 * S6$bx1 + S6$az1 * S6$bw0 + S6$aw1 * S6$bz0 + S6$ax1 * S6$by0 - S6$ay1 * S6$bx0;
      S6$dquat1[7] = S6$aw0 * S6$bw1 - S6$ax0 * S6$bx1 - S6$ay0 * S6$by1 - S6$az0 * S6$bz1 + S6$aw1 * S6$bw0 - S6$ax1 * S6$bx0 - S6$ay1 * S6$by0 - S6$az1 * S6$bz0;
            dt[oi++] = bone.trans.id;
            dt[oi++] = dq[0];
            dt[oi++] = dq[1];
            dt[oi++] = dq[2];
            dt[oi++] = dq[3];
            dt[oi++] = dq[4];
            dt[oi++] = dq[5];
            dt[oi++] = dq[6];
            dt[oi++] = dq[7];
          }
        }



        return oi;

      });


      console.log("bone system", bones_sys);


      var v1 = [], v2 = [], ii = 0, nodes_count, q1 = [], q2 = [];
      var v_up = [0, -1, 0];

      //set ik
      bones_sys.commands[5100] = function (dt, ci) {

        var chain = [];
        nodes_count = dt[ci++];
        ii = 0;

        while (ii < nodes_count) {
          chain[ii++] = bones_sys.transforms[dt[ci++]];
        }
        bones_sys.ske_ik_chains.push(chain);
      };

      S5$tmpvec3 = [0, 0, 0]; S5$xUnitVec3 = [-1, 0, 0]; S5$yUnitVec3 = [0, 1, 0];

      bones_sys.resolve_ik = function (chain) {
        nodes_count = chain.length - 1;
        if (!chain.prepared) {
          chain.len = 0;
          ii = 0;

          while (++ii < nodes_count) {
            v1[0] = chain[ii].world_pos[0] - chain[ii - 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii - 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii - 1].world_pos[2];
            chain[ii - 1].len =
              Math.abs(Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]));
            chain.len += chain[ii - 1].len;


          }

          chain.effector = chain[nodes_count];
          chain.prepared = true;
          console.log("chain", chain)
        }



        // chain[0].update = true;
        chain[nodes_count - 1].world_pos[0] = chain.effector.world_pos[0]; chain[nodes_count - 1].world_pos[1] = chain.effector.world_pos[1]; chain[nodes_count - 1].world_pos[2] = chain.effector.world_pos[2];;

        ii = nodes_count - 2;
        while (ii > 0) {
          v1[0] = chain[ii].world_pos[0] - chain[ii + 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii + 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii + 1].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          chain[ii].world_pos[0] = chain[ii + 1].world_pos[0] + v1[0] * chain[ii].len; chain[ii].world_pos[1] = chain[ii + 1].world_pos[1] + v1[1] * chain[ii].len; chain[ii].world_pos[2] = chain[ii + 1].world_pos[2] + v1[2] * chain[ii].len;

          ii--;

        }

        ii = 1;
        while (ii < nodes_count) {
          v1[0] = chain[ii - 1].world_pos[0] - chain[ii].world_pos[0]; v1[1] = chain[ii - 1].world_pos[1] - chain[ii].world_pos[1]; v1[2] = chain[ii - 1].world_pos[2] - chain[ii].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          chain[ii].world_pos[0] = chain[ii - 1].world_pos[0] + v1[0] * -chain[ii - 1].len; chain[ii].world_pos[1] = chain[ii - 1].world_pos[1] + v1[1] * -chain[ii - 1].len; chain[ii].world_pos[2] = chain[ii - 1].world_pos[2] + v1[2] * -chain[ii - 1].len;
          chain[ii].update = true;


          ii++;
        }

        ii = 0;
        while (ii < nodes_count - 1) {
          v1[0] = chain[ii].world_pos[0] - chain[ii + 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii + 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii + 1].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          S5$quat1 = chain[ii].world_rot;
      S5$quat2 = v_up;
      S5$quat3 = v1;


      S5$dot = S5$quat2[0] * S5$quat3[0] + S5$quat2[1] * S5$quat3[1] + S5$quat2[2] * S5$quat3[2]

      if (S5$dot < -0.999999) {

        S5$tmpvec3[0] = S5$xUnitVec3[1] * S5$quat2[2] - S5$xUnitVec3[2] * S5$quat2[1];
        S5$tmpvec3[1] = S5$xUnitVec3[2] * S5$quat2[0] - S5$xUnitVec3[0] * S5$quat2[2];
        S5$tmpvec3[2] = S5$xUnitVec3[0] * S5$quat2[1] - S5$xUnitVec3[1] * S5$quat2[0];


        S5$qLen =
          Math.abs(Math.sqrt(S5$tmpvec3[0] * S5$tmpvec3[0] + S5$tmpvec3[1] * S5$tmpvec3[1] + S5$tmpvec3[2] * S5$tmpvec3[2]));

        if (S5$qLen < 0.000001) {
          S5$tmpvec3[0] = S5$yUnitVec3[1] * S5$quat2[2] - S5$yUnitVec3[2] * S5$quat2[1];
      S5$tmpvec3[1] = S5$yUnitVec3[2] * S5$quat2[0] - S5$yUnitVec3[0] * S5$quat2[2];
      S5$tmpvec3[2] = S5$yUnitVec3[0] * S5$quat2[1] - S5$yUnitVec3[1] * S5$quat2[0];
        }

        S0$x = S5$tmpvec3[0] * S5$tmpvec3[0] + S5$tmpvec3[1] * S5$tmpvec3[1] + S5$tmpvec3[2] * S5$tmpvec3[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      S5$tmpvec3[0] = S5$tmpvec3[0] * S0$x; S5$tmpvec3[1] = S5$tmpvec3[1] * S0$x; S5$tmpvec3[2] = S5$tmpvec3[2] * S0$x;


        S5$scale0 = Math.PI * 0.5;
        S5$scale1 = Math.sin(S5$scale0);
        S5$quat1[0] = S5$scale1 * S5$tmpvec3[0];
        S5$quat1[1] = S5$scale1 * S5$tmpvec3[1];
        S5$quat1[2] = S5$scale1 * S5$tmpvec3[2];
        S5$quat1[3] = Math.cos(S5$scale0);




      }
      else if (S5$dot > 0.999999) {
        S5$quat1[0] = 0;S5$quat1[1] = 0; S5$quat1[2] = 0; S5$quat1[3] = 1;

      }

      else {
        S5$quat1[0] = S5$quat2[1] * S5$quat3[2] - S5$quat2[2] * S5$quat3[1];
      S5$quat1[1] = S5$quat2[2] * S5$quat3[0] - S5$quat2[0] * S5$quat3[2];
      S5$quat1[2] = S5$quat2[0] * S5$quat3[1] - S5$quat2[1] * S5$quat3[0];
        S5$quat1[3] = 1 + S5$dot;


        S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
        S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;
        if (S5$qLen > 0) {
          S5$qLen = 1 / Math.sqrt(S5$qLen);
        }
        S5$quat1[0] = S5$qX * S5$qLen;
        S5$quat1[1] = S5$qY * S5$qLen;
        S5$quat1[2] = S5$qZ * S5$qLen;
        S5$quat1[3] = S5$qW * S5$qLen;

      }

          if (chain[ii].p > 0) {

          }
          else {
            chain[ii].world_rot[0] = chain[ii].world_rot[0];chain[ii].world_rot[1] = chain[ii].world_rot[1];chain[ii].world_rot[2] = chain[ii].world_rot[2];chain[ii].world_rot[3] = chain[ii].world_rot[3];
          }


          chain[ii].update = true;
          ii++;
        }


      }


      bones_sys.resolve_ik = function (chain) {
        nodes_count = chain.length - 1;
        if (!chain.prepared) {
          chain.len = 0;
          ii = 0;

          while (++ii < nodes_count) {
            v1[0] = chain[ii].world_pos[0] - chain[ii - 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii - 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii - 1].world_pos[2];
            chain[ii - 1].len =
              Math.abs(Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]));
            chain.len += chain[ii - 1].len;


          }

          chain.effector = chain[nodes_count];
          chain.prepared = true;
        }



        // chain[0].update = true;
        chain[nodes_count - 1].world_pos[0] = chain.effector.world_pos[0]; chain[nodes_count - 1].world_pos[1] = chain.effector.world_pos[1]; chain[nodes_count - 1].world_pos[2] = chain.effector.world_pos[2];;

        ii = nodes_count - 2;
        while (ii > 0) {
          v1[0] = chain[ii].world_pos[0] - chain[ii + 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii + 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii + 1].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          chain[ii].world_pos[0] = chain[ii + 1].world_pos[0] + v1[0] * chain[ii].len; chain[ii].world_pos[1] = chain[ii + 1].world_pos[1] + v1[1] * chain[ii].len; chain[ii].world_pos[2] = chain[ii + 1].world_pos[2] + v1[2] * chain[ii].len;

          ii--;

        }

        ii = 1;
        while (ii < nodes_count) {
          v1[0] = chain[ii - 1].world_pos[0] - chain[ii].world_pos[0]; v1[1] = chain[ii - 1].world_pos[1] - chain[ii].world_pos[1]; v1[2] = chain[ii - 1].world_pos[2] - chain[ii].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          chain[ii].world_pos[0] = chain[ii - 1].world_pos[0] + v1[0] * -chain[ii - 1].len; chain[ii].world_pos[1] = chain[ii - 1].world_pos[1] + v1[1] * -chain[ii - 1].len; chain[ii].world_pos[2] = chain[ii - 1].world_pos[2] + v1[2] * -chain[ii - 1].len;
          // chain[ii].update = true;


          ii++;
        }

        ii = 0;
        while (ii < nodes_count - 1) {
          v1[0] = chain[ii].world_pos[0] - chain[ii + 1].world_pos[0]; v1[1] = chain[ii].world_pos[1] - chain[ii + 1].world_pos[1]; v1[2] = chain[ii].world_pos[2] - chain[ii + 1].world_pos[2];
          S0$x = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      v1[0] = v1[0] * S0$x; v1[1] = v1[1] * S0$x; v1[2] = v1[2] * S0$x;
          S5$quat1 = q1;
      S5$quat2 = v_up;
      S5$quat3 = v1;


      S5$dot = S5$quat2[0] * S5$quat3[0] + S5$quat2[1] * S5$quat3[1] + S5$quat2[2] * S5$quat3[2]

      if (S5$dot < -0.999999) {

        S5$tmpvec3[0] = S5$xUnitVec3[1] * S5$quat2[2] - S5$xUnitVec3[2] * S5$quat2[1];
        S5$tmpvec3[1] = S5$xUnitVec3[2] * S5$quat2[0] - S5$xUnitVec3[0] * S5$quat2[2];
        S5$tmpvec3[2] = S5$xUnitVec3[0] * S5$quat2[1] - S5$xUnitVec3[1] * S5$quat2[0];


        S5$qLen =
          Math.abs(Math.sqrt(S5$tmpvec3[0] * S5$tmpvec3[0] + S5$tmpvec3[1] * S5$tmpvec3[1] + S5$tmpvec3[2] * S5$tmpvec3[2]));

        if (S5$qLen < 0.000001) {
          S5$tmpvec3[0] = S5$yUnitVec3[1] * S5$quat2[2] - S5$yUnitVec3[2] * S5$quat2[1];
      S5$tmpvec3[1] = S5$yUnitVec3[2] * S5$quat2[0] - S5$yUnitVec3[0] * S5$quat2[2];
      S5$tmpvec3[2] = S5$yUnitVec3[0] * S5$quat2[1] - S5$yUnitVec3[1] * S5$quat2[0];
        }

        S0$x = S5$tmpvec3[0] * S5$tmpvec3[0] + S5$tmpvec3[1] * S5$tmpvec3[1] + S5$tmpvec3[2] * S5$tmpvec3[2];
      if (S0$x > 0) {
        S0$x = 1 / Math.sqrt(S0$x);
      }
      S5$tmpvec3[0] = S5$tmpvec3[0] * S0$x; S5$tmpvec3[1] = S5$tmpvec3[1] * S0$x; S5$tmpvec3[2] = S5$tmpvec3[2] * S0$x;


        S5$scale0 = Math.PI * 0.5;
        S5$scale1 = Math.sin(S5$scale0);
        S5$quat1[0] = S5$scale1 * S5$tmpvec3[0];
        S5$quat1[1] = S5$scale1 * S5$tmpvec3[1];
        S5$quat1[2] = S5$scale1 * S5$tmpvec3[2];
        S5$quat1[3] = Math.cos(S5$scale0);




      }
      else if (S5$dot > 0.999999) {
        S5$quat1[0] = 0;S5$quat1[1] = 0; S5$quat1[2] = 0; S5$quat1[3] = 1;

      }

      else {
        S5$quat1[0] = S5$quat2[1] * S5$quat3[2] - S5$quat2[2] * S5$quat3[1];
      S5$quat1[1] = S5$quat2[2] * S5$quat3[0] - S5$quat2[0] * S5$quat3[2];
      S5$quat1[2] = S5$quat2[0] * S5$quat3[1] - S5$quat2[1] * S5$quat3[0];
        S5$quat1[3] = 1 + S5$dot;


        S5$qX = S5$quat1[0]; S5$qY = S5$quat1[1]; S5$qZ = S5$quat1[2]; S5$qW = S5$quat1[3];
        S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;
        if (S5$qLen > 0) {
          S5$qLen = 1 / Math.sqrt(S5$qLen);
        }
        S5$quat1[0] = S5$qX * S5$qLen;
        S5$quat1[1] = S5$qY * S5$qLen;
        S5$quat1[2] = S5$qZ * S5$qLen;
        S5$quat1[3] = S5$qW * S5$qLen;

      }

          if (chain[ii].p > 0) {
            S5$quat1 = q2;
      S5$quat2 = bones_sys.transforms[chain[ii].p].world_rot;

      S5$qX = S5$quat2[0]; S5$qY = S5$quat2[1]; S5$qZ = S5$quat2[2]; S5$qW = S5$quat2[3];
      S5$qLen = S5$qX * S5$qX + S5$qY * S5$qY + S5$qZ * S5$qZ + S5$qW * S5$qW;
      if (S5$qLen > 0) {
        S5$qLen = 1 / Math.sqrt(S5$qLen);
      }
      S5$quat1[0] = -S5$qX * S5$qLen;
      S5$quat1[1] = -S5$qY * S5$qLen;
      S5$quat1[2] = -S5$qZ * S5$qLen;
      S5$quat1[3] = S5$qW * S5$qLen;
            S5$quat1 = chain[ii].rot;
      S5$quat2 = q2;
      S5$quat3 = q1;


      S5$qX = S5$quat2[0]; S5$qY = S5$quat2[1]; S5$qZ = S5$quat2[2]; S5$qW = S5$quat2[3];

      S5$dqX = S5$quat3[0]; S5$dqY = S5$quat3[1]; S5$dqZ = S5$quat3[2]; S5$dqW = S5$quat3[3];

      S5$quat1[0] = S5$qX * S5$dqW + S5$qW * S5$dqX + S5$qY * S5$dqZ - S5$qZ * S5$dqY;
      S5$quat1[1] = S5$qY * S5$dqW + S5$qW * S5$dqY + S5$qZ * S5$dqX - S5$qX * S5$dqZ;
      S5$quat1[2] = S5$qZ * S5$dqW + S5$qW * S5$dqZ + S5$qX * S5$dqY - S5$qY * S5$dqX;
      S5$quat1[3] = S5$qW * S5$dqW - S5$qX * S5$dqX - S5$qY * S5$dqY - S5$qZ * S5$dqZ;
          }
          else {
            chain[ii].rot[0] = q1[0];chain[ii].rot[1] = q1[1];chain[ii].rot[2] = q1[2];chain[ii].rot[3] = q1[3];
          }


          chain[ii].update = true;
          ii++;
        }


      }

    
      bones_sys.windup.push(function (dt, oi) {
        bones_sys.ske_ik_chains.forEach(bones_sys.resolve_ik);
      });
    }
    function bones_system(def) {
      _super.apply(this, arguments);
      var self = this;

      this.bones = {
        pool: new fin.object_pooler(function (id) {
          var bone = {
            dq: new Float32Array(8),
          };
          self.bones[id] = bone;
          return bone;
        })
      };
      var trans_sys = this.app.use_system('transform_system');

      trans_sys.worker.commands_group(function (bone_sys, cmd, worker) {

        var ci;
        bone_sys.set_ik = function (nodes) {
          ci = worker.begin_command(5100, nodes.length + 1);
          cmd[ci++] = nodes.length;
          nodes.forEach(function (n) {
            cmd[ci++] = n;
          })

        };

        bone_sys.set_bone = function (bone, bone_bind) {
          ci = worker.begin_command(5000, 9);
          cmd[ci++] = bone.trans.id;
          cmd[ci++] = bone_bind[0];
          cmd[ci++] = bone_bind[1];
          cmd[ci++] = bone_bind[2];
          cmd[ci++] = bone_bind[3];
          cmd[ci++] = bone_bind[4];
          cmd[ci++] = bone_bind[5];
          cmd[ci++] = bone_bind[6];
          cmd[ci++] = bone_bind[7];
        }


        var bones = bone_sys.bones, bone, bid, dq;

        worker.add_output(1010101, function (dt, oi, count) {
          while (oi < count) {
            bid = dt[oi++];
            bone = bones[bid];
            if (bone) {
              dq = bone.dq
              dq[0] = dt[oi++];
              dq[1] = dt[oi++];
              dq[2] = dt[oi++];
              dq[3] = dt[oi++];
              dq[4] = dt[oi++];
              dq[5] = dt[oi++];
              dq[6] = dt[oi++];
              dq[7] = dt[oi++];

            }

          }
        });


      }, this);

      trans_sys.worker.execute(worker_script);


      console.log(this);



    }




    proto.skin_material = function (mat) {


      mat.shader = mat.shader.extend(`
attribute vec4 a_bone_indices;
attribute vec4 a_bone_weights;

uniform vec4 bone_qr[90];
uniform vec4 bone_qd[90];

vec3 dquat_transform(vec4 qr, vec4 qd, vec3 v)
{
   return (v + cross(2.0 * qr.xyz, cross(qr.xyz, v) + qr.w * v))+
	  (2.0 * (qr.w * qd.xyz - qd.w * qr.xyz + cross(qr.xyz, qd.xyz)));
}
vec3 dquat_transform2(vec4 qr, vec4 qd, vec3 v)
{
   return (v + cross(2.0 * qr.xyz, cross(qr.xyz, v) + qr.w * v));
}

vec4 _qr;
vec4 _qd;

vec4 att_position(void){
vec4 pos=super_att_position();


vec4 w=a_bone_weights;
int i0=int(a_bone_indices.x);
int i1=int(a_bone_indices.y);
int i2=int(a_bone_indices.z);
int i3=int(a_bone_indices.w);


vec4 dqr0 = bone_qr[i0];
vec4 dqr1 = bone_qr[i1];
vec4 dqr2 = bone_qr[i2];
vec4 dqr3 = bone_qr[i3];


w *= 1.0 / (w.x + w.y + w.z + w.w);

if (dot(dqr0, dqr1) < 0.0) w.y *= -1.0;
if (dot(dqr0, dqr2) < 0.0) w.z *= -1.0;
if (dot(dqr0, dqr3) < 0.0) w.w *= -1.0;


_qr=dqr0*w.x+dqr1*w.y+dqr2*w.z+dqr3*w.w;
_qd=bone_qd[i0]*w.x+bone_qd[i1]*w.y+bone_qd[i2]*w.z+bone_qd[i3]*w.w;
float len =1.0/ length(_qr);
_qr *= len;
_qd *= len;

pos.xyz=dquat_transform(_qr,_qd,pos.xyz);

return pos;

}
vec4 att_normal(void){
    return vec4(dquat_transform2(_qr,_qd,a_normal_rw),0.0);
}

void vertex(){
super_vertex();

v_uv_rw=a_position_rw.xy;
}


`);

      var qr = math.quat(), qd = math.quat(), qq = null, ske = null, j = null, i = 0,bone;
      mat.on_before_render.add(function (renderer, shader, mesh) {

        ske = mesh.user_data.ske;

        for (i = 0; i < ske.bones.length; i++) {
          bone = ske.bones[i];
          qq =bone.dq;
          qr[0] = qq[0];
          qr[1] = qq[1];
          qr[2] = qq[2];
          qr[3] = qq[3];

          qd[0] = qq[4];
          qd[1] = qq[5];
          qd[2] = qq[6];
          qd[3] = qq[7];


          shader.set_uniform("bone_qr[" + i + "]", qr);
          shader.set_uniform("bone_qd[" + i + "]", qd);
        }
      });

      return mat;

    }

    return bones_system;



  }, ecs.system));
}})()(_FM["fin"],_FM["ge"],_FM["ecs"],_FM["math"]);
(function() { return function efffects(ge, math) {

  ge.effects = {};

  var glsl = ge.webgl.shader.create_chunks_lib(`/*chunk-pp-default*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
const vec2 madd=vec2(0.5,0.5);
varying vec2 v_uv_rw;
void vertex()
{
    gl_Position = vec4(a_position_rw.xy,0.0,1.0);	
	v_uv_rw = a_position_rw.xy*madd+madd;  
}
<?=chunk('precision')?>
uniform sampler2D u_texture_input_rw;
varying vec2 v_uv_rw;
void fragment(void){	
gl_FragColor = texture2D(u_texture_input_rw, v_uv_rw) ;	


}



/*chunk-pp-picture-adjustment*/

uniform mat3 u_pa_params;

void fragment(){	
	vec4 c = texture2D(u_texture_input_rw, v_uv_rw);
    if (c.a > 0.0) {

		
    }
        float gamma=u_pa_params[0].x;
		float contrast=u_pa_params[0].y;
		float saturation=u_pa_params[0].z;
		float brightness=u_pa_params[1].x;
		float red=u_pa_params[1].y;
		float green=u_pa_params[1].z;
		float blue=u_pa_params[2].x;
		
        //c.rgb /= c.a;

        vec3 rgb = pow(c.rgb, vec3(1.0 / gamma));
        rgb = mix(vec3(0.5), mix(vec3(dot(vec3(0.2125, 0.7154, 0.0721), rgb)), rgb, saturation), contrast);
        rgb.r *= red;
        rgb.g *= green;
        rgb.b *= blue;

        c.rgb = rgb * brightness;        
     //   c.rgb *= c.a;


	float alpha=u_pa_params[2].y;
    gl_FragColor = c * alpha;
}


/*chunk-pp-fxaa*/

uniform vec3 u_inverse_filter_texture_size;
uniform vec3 u_fxaa_params;

void fragment(void){	
	float R_fxaaSpanMax=u_fxaa_params.x;
	float R_fxaaReduceMin=u_fxaa_params.y;
	float R_fxaaReduceMul=u_fxaa_params.z;	
	vec2 texCoordOffset = u_inverse_filter_texture_size.xy;
	vec3 luma = vec3(0.299, 0.587, 0.114);	
	float lumaTL = dot(luma, texture2D(u_texture_input_rw, v_uv_rw.xy + (vec2(-1.0, -1.0) * texCoordOffset)).xyz);
	float lumaTR = dot(luma, texture2D(u_texture_input_rw, v_uv_rw.xy + (vec2(1.0, -1.0) * texCoordOffset)).xyz);
	float lumaBL = dot(luma, texture2D(u_texture_input_rw, v_uv_rw.xy + (vec2(-1.0, 1.0) * texCoordOffset)).xyz);
	float lumaBR = dot(luma, texture2D(u_texture_input_rw, v_uv_rw.xy + (vec2(1.0, 1.0) * texCoordOffset)).xyz);
	float lumaM  = dot(luma, texture2D(u_texture_input_rw, v_uv_rw.xy).xyz);

	vec2 dir;
	dir.x = -((lumaTL + lumaTR) - (lumaBL + lumaBR));
	dir.y = ((lumaTL + lumaBL) - (lumaTR + lumaBR));
	
	float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * (R_fxaaReduceMul * 0.25), R_fxaaReduceMin);
	float inverseDirAdjustment = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);
	
	dir = min(vec2(R_fxaaSpanMax, R_fxaaSpanMax), 
		max(vec2(-R_fxaaSpanMax, -R_fxaaSpanMax), dir * inverseDirAdjustment)) * texCoordOffset;

	vec3 result1 = (1.0/2.0) * (
		texture2D(u_texture_input_rw, v_uv_rw.xy + (dir * vec2(1.0/3.0 - 0.5))).xyz +
		texture2D(u_texture_input_rw, v_uv_rw.xy + (dir * vec2(2.0/3.0 - 0.5))).xyz);

	vec3 result2 = result1 * (1.0/2.0) + (1.0/4.0) * (
		texture2D(u_texture_input_rw, v_uv_rw.xy + (dir * vec2(0.0/3.0 - 0.5))).xyz +
		texture2D(u_texture_input_rw, v_uv_rw.xy + (dir * vec2(3.0/3.0 - 0.5))).xyz);

	float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
	float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));
	float lumaResult2 = dot(luma, result2);
	

if(lumaResult2 < lumaMin || lumaResult2 > lumaMax)
		gl_FragColor = vec4(result1, 1.0);
	else
		gl_FragColor = vec4(result2, 1.0);

if(v_uv_rw.x<0.5){
    gl_FragColor=texture2D(u_texture_input_rw, v_uv_rw);
}
else {
	
gl_FragColor.rgb*=0.75;
}

}



/*chunk-pp-glow*/
uniform sampler2D u_glow_emission_rw;
uniform vec3 u_glow_params_rw;

void fragment(void){	

vec4 cBase = texture2D(u_texture_input_rw, v_uv_rw);
	vec4 cOver = texture2D(u_glow_emission_rw, v_uv_rw);			
	vec4 blend = cBase + cOver * u_glow_params_rw.z;
    blend = vec4(1.0) - exp(-blend * u_glow_params_rw.x);
    blend = pow(blend, vec4(1.0 / u_glow_params_rw.y));
	gl_FragColor =blend;

}

/*chunk-pp-blur*/

uniform vec2 u_offset_rw;
uniform vec3 u_blurKernel_rw;
void fragment(){	
	vec3 A = u_blurKernel_rw.x* texture2D(u_texture_input_rw, v_uv_rw - u_offset_rw).xyz;
	vec3 B = u_blurKernel_rw.y* texture2D(u_texture_input_rw, v_uv_rw).xyz;
	vec3 C = u_blurKernel_rw.z* texture2D(u_texture_input_rw, v_uv_rw + u_offset_rw).xyz;
	vec3 color = A + B + C;
	gl_FragColor = vec4(color, 1);	
	
}



/*chunk-pp-emission*/
uniform vec4 u_bright_threshold_rw;
void fragment(){	
	 vec4 color = texture2D(u_texture_input_rw, v_uv_rw);        		
	 float luminance = dot(color.rgb, u_bright_threshold_rw.xyz );
	 luminance+=(color.a+u_bright_threshold_rw.w);		 
	 gl_FragColor = luminance* color;
}








/*chunk-pp-bloom*/
uniform sampler2D u_glow_emission_rw;
uniform vec3 u_glow_params_rw;

void fragment(void){	

vec4 cBase = texture2D(u_texture_input_rw, v_uv_rw);
	vec4 cOver = texture2D(u_glow_emission_rw, v_uv_rw);			
	vec4 blend = cBase + cOver * u_glow_params_rw.z;
    blend = vec4(1.0) - exp(-blend * u_glow_params_rw.x);
    blend = pow(blend, vec4(1.0 / u_glow_params_rw.y));
	gl_FragColor =blend;

}

/*chunk-pp-bloom-blur*/

uniform vec2 u_offset_rw;
uniform vec3 u_blurKernel_rw;
void fragment(){	
	vec3 A = u_blurKernel_rw.x* texture2D(u_texture_input_rw, v_uv_rw - u_offset_rw).xyz;
	vec3 B = u_blurKernel_rw.y* texture2D(u_texture_input_rw, v_uv_rw).xyz;
	vec3 C = u_blurKernel_rw.z* texture2D(u_texture_input_rw, v_uv_rw + u_offset_rw).xyz;
	vec3 color = A + B + C;
	gl_FragColor = vec4(color, 1);	
	
}



/*chunk-pp-bloom-emission*/
uniform vec4 u_bright_threshold_rw;
void fragment(){	
	 vec4 color = texture2D(u_texture_input_rw, v_uv_rw);        		
	 float luminance = dot(color.rgb, u_bright_threshold_rw.xyz );
	 luminance+=(color.a+u_bright_threshold_rw.w);		 
	 gl_FragColor =  color*luminance;
	
}













/*chunk-glow-material*/
void vertex(void){
super_vertex();
}

void fragment(void) {
super_fragment();

gl_FragColor.rgb*=1.1;
}





/*chunk-skybox*/
<?=chunk('precision')?>
attribute vec4 a_position_rw;
varying vec4 v_position_rw;

void vertex(){
  v_position_rw = a_position_rw;
  gl_Position = a_position_rw;
  gl_Position.z = 1.0;
}


<?=chunk('precision')?>
uniform mat4 u_view_projection_matrix_rw;
uniform vec4 u_sun_params_rw;
varying vec4 v_position_rw;
vec3 fragPosition;

const float turbidity = 10.0;
const float reileigh = 2.0;
const float mieCoefficient = 0.005;
const float mieDirectionalG = 0.8;

const float e = 2.71828182845904523536028747135266249775724709369995957;
const float pi = 3.141592653589793238462643383279502884197169;

const float n = 1.0003;// refractive index of air
const float N = 2.545E25; // number of molecules per unit volume for air at
											
const float pn = 0.035;
// wavelength of used primaries, according to preetham
const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);

const vec3 K = vec3(0.686, 0.678, 0.666);
const float v = 4.0;

const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 up = vec3(0.0, 1.0, 0.0);

const float EE = 1000.0;

float sunAngularDiameterCos =u_sun_params_rw.w; // 0.999956;

const float cutoffAngle = pi/1.95;
const float steepness = 1.5;

vec3 simplifiedRayleigh() {
	return 0.0005 / vec3(94, 40, 18);
}

float rayleighPhase(float cosTheta) {
	return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));
}

vec3 totalMie(vec3 lambda, vec3 K, float T) {
	float c = (0.2 * T ) * 10E-18;
	return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
}

float hgPhase(float cosTheta, float g) {
	return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos) {	
	return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos))/steepness)));
}

float A = 0.15;
float B = 0.50;
float C = 0.10;
float D = 0.20;
float E = 0.02;
float F = 0.30;
float W = 1000.0;

vec3 Uncharted2Tonemap(vec3 x) {
   return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

<?=chunk('global-render-system-fog-effect')?>

void fragment(void) {
	
   fragPosition=(u_view_projection_matrix_rw * v_position_rw).xyz;
	vec3 sunPosition=u_sun_params_rw.xyz;
	float sunfade = 1.0 - clamp(1.0 - exp(sunPosition.y), 0.0, 1.0);
	float reileighCoefficient = reileigh - (1.0 * (1.0-sunfade));
	vec3 sunDirection = normalize(sunPosition);
	float sunE = sunIntensity(dot(sunDirection, up));
	vec3 betaR = simplifiedRayleigh() * reileighCoefficient;

	// mie coefficients
	vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

	// optical length
	// cutoff angle at 90 to avoid singularity in next formula.
	float zenithAngle = acos(max(0.0, dot(up, normalize(fragPosition))));
	float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
	float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));

	// combined extinction factor
	vec3 Fex = exp(-(betaR * sR + betaM * sM));

	// in scattering
	float cosTheta = dot(normalize(fragPosition), sunDirection);

	float rPhase = rayleighPhase(cosTheta * 0.5+0.5);
	vec3 betaRTheta = betaR * rPhase;

	float mPhase = hgPhase(cosTheta, mieDirectionalG);
	vec3 betaMTheta = betaM * mPhase;

	vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));
	Lin *= mix(vec3(1.0),pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex,vec3(1.0/2.0)),clamp(pow(1.0-dot(up, sunDirection),5.0),0.0,1.0));

	//nightsky
	vec3 direction = normalize(fragPosition);
	float theta = acos(direction.y); // elevation --> y-axis, [-pi/2, pi/2]
	float phi = atan(direction.z, direction.x); // azimuth --> x-axis [-pi/2, pi/2]
	vec2 uv = vec2(phi, theta) / vec2(2.0*pi, pi) + vec2(0.5, 0.0);
	vec3 L0 = vec3(0.1) * Fex;

	// composition + solar disc
	float sundisk = smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);
	L0 += (sunE * 19000.0 * Fex)*sundisk;

	vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));

	vec3 texColor = (Lin+L0);
	texColor *= 0.04 ;
	texColor += vec3(0.0,0.001,0.0025)*0.3;

	vec3 curr = Uncharted2Tonemap(texColor);
	vec3 color = curr*whiteScale;

	vec3 retColor = pow(color,vec3(1.0/(1.2+(1.2*sunfade))));

	gl_FragColor = vec4(retColor, 1.0);
	gl_FragColor=mix_fog_color(gl_FragColor);
	
}





/*chunk-skybox2*/
<?=chunk('precision')?>
attribute vec4 a_position_rw;
varying vec4 v_position_rw;

void vertex(){
  v_position_rw = a_position_rw;
  gl_Position = a_position_rw;
  gl_Position.z = 1.0;
}


<?=chunk('precision')?>
uniform mat4 u_view_projection_matrix_rw;
uniform vec4 u_sun_params_rw;
varying vec4 v_position_rw;


const float depolarizationFactor=0.067;
const float luminance=1.0;
const float mieCoefficient=0.00335;
const float mieDirectionalG=0.787;
const vec3 mieKCoefficient=vec3(0.686,0.678,0.666);
const float mieV=4.012;
const float mieZenithLength=500.0;
const float numMolecules=2.542e+25;
const vec3 primaries=vec3(6.8e-7,5.5e-7,4.5e-7);
const float rayleigh=1.0;
const float rayleighZenithLength=615.0;
const float refractiveIndex=1.000317;
const float sunAngularDiameterDegrees=0.00758;
const float sunIntensityFactor=1111.0;
const float sunIntensityFalloffSteepness=0.98;
const float tonemapWeighting=9.50;
const float turbidity=1.25;

const float PI = 3.141592653589793238462643383279502884197169;
const vec3 UP = vec3(0.0, 1.0, 0.0);

vec3 totalRayleigh(vec3 lambda)
{
	return (8.0 * pow(PI, 3.0) * pow(pow(refractiveIndex, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * depolarizationFactor)) / (3.0 * numMolecules * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * depolarizationFactor));
}

vec3 totalMie(vec3 lambda, vec3 K, float T)
{
	float c = 0.2 * T * 10e-18;
	return 0.434 * c * PI * pow((2.0 * PI) / lambda, vec3(mieV - 2.0)) * K;
}

float rayleighPhase(float cosTheta)
{
	return (3.0 / (16.0 * PI)) * (1.0 + pow(cosTheta, 2.0));
}

float henyeyGreensteinPhase(float cosTheta, float g)
{
	return (1.0 / (4.0 * PI)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos)
{
	float cutoffAngle = PI / 1.95; // Earth shadow hack
	return sunIntensityFactor * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos)) / sunIntensityFalloffSteepness)));
}

// Whitescale tonemapping calculation, see http://filmicgames.com/archives/75
// Also see http://blenderartists.org/forum/showthread.php?321110-Shaders-and-Skybox-madness
const float A = 0.15; // Shoulder strength
const float B = 0.50; // Linear strength
const float C = 0.10; // Linear angle
const float D = 0.20; // Toe strength
const float E = 0.02; // Toe numerator
const float F = 0.30; // Toe denominator
vec3 Uncharted2Tonemap(vec3 W)
{
	return ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
}



void fragment(void) {
	
  vec3 fragPosition=normalize((u_view_projection_matrix_rw * v_position_rw).xyz);
  // In-scattering	
	vec3 sunDirection=u_sun_params_rw.xyz;


  //float sunfade = 1.0 - clamp(1.0 - exp(((sunDirection*4500000.0).y / 450000.0)), 0.0, 1.0);

  float sunfade = 1.0 - clamp(1.0 - exp(sunDirection.y), 0.0, 1.0);
	float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
	vec3 betaR = totalRayleigh(primaries) * rayleighCoefficient;
	
	// Mie coefficient
	vec3 betaM = totalMie(primaries, mieKCoefficient, turbidity) * mieCoefficient;
	
	// Optical length, cutoff angle at 90 to avoid singularity
	float zenithAngle = acos(max(0.0, dot(UP, fragPosition)));
	float denom = cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / PI), -1.253);
	float sR = rayleighZenithLength / denom;
	float sM = mieZenithLength / denom;
	
	// Combined extinction factor
	vec3 Fex = exp(-(betaR * sR + betaM * sM));
	
	
	float cosTheta = dot(fragPosition, sunDirection);
	vec3 betaRTheta = betaR * rayleighPhase(cosTheta * 0.5 + 0.5);
	vec3 betaMTheta = betaM * henyeyGreensteinPhase(cosTheta, mieDirectionalG);
	float sunE = sunIntensity(dot(sunDirection, UP));
	vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
	Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - dot(UP, sunDirection), 5.0), 0.0, 1.0));
	
	// Composition + solar disc
	float sunAngularDiameterCos = cos(sunAngularDiameterDegrees);
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	vec3 L0 = vec3(0.1) * Fex;
	L0 += sunE * 19000.0 * Fex * sundisk;
	vec3 texColor = Lin + L0;
	texColor *= 0.04;
	texColor += vec3(0.0, 0.001, 0.0025) * 0.3;
	
	// Tonemapping
	vec3 whiteScale = 1.0 / Uncharted2Tonemap(vec3(tonemapWeighting));
	vec3 curr = Uncharted2Tonemap((log2(2.0 / pow(luminance, 4.0))) * texColor);
	vec3 color = curr * whiteScale;
	vec3 retColor = pow(color, vec3(1.0 / (1.2 + (1.2 * sunfade))));

	gl_FragColor = vec4(retColor, 1.0);
}
}`);

  // Post Process

  ge.effects.post_process = ge.define(function (proto) {

    function post_process(shader) {
      this.guid = fin.guidi();
      this.shader = shader || ge.effects.post_process.shader;
      if (!this.on_apply) {
        this.on_apply = null;
      }
      this.enabled = true;
      this.post_shading = false;
    }

    post_process.shader = ge.webgl.shader.parse(glsl["pp-default"]);
    proto.resize = function (width, height) { }
    proto.bind_output = function (renderer, output) {
      if (output === null) {
        renderer.gl.bindFramebuffer(36160, null);
        renderer.gl.viewport(0, 0, renderer.render_width, renderer.render_height);
      }
      else {
        output.bind();
      }
    }

    var on_apply_params = [null, null, null];
    proto.apply = function (renderer, input, output) {
      renderer.use_shader(this.shader);
      this.bind_output(renderer, output);
      if (this.on_apply !== null) {
        on_apply_params[0] = renderer;
        on_apply_params[1] = input;
        on_apply_params[2] = output;
        input = this.on_apply.apply(this, on_apply_params);

      }     
      renderer.use_direct_texture(input, 0);
      renderer.draw_full_quad();
    }

    proto.on_apply = function (renderer, input, output) {
      return input;
    };

    return post_process;
  });


  ge.effects.post_process.fxaa = ge.define(function (proto, _super) {


    function fxaa(params) {
      params = params || {};
      _super.apply(this);
      this.shader = ge.effects.post_process.fxaa.shader;
      this.span_max = 16;
      this.reduce_min = (1 / 256);
      this.reduce_mul = (1 / 8);
      this.enabled = true;
      if (params.enabled !== undefined) this.enabled = params.enabled;
      fin.merge_object(params, this);

    }



    fxaa.shader = ge.effects.post_process.shader.extend(glsl["pp-fxaa"]);


    var u_inverse_filter_texture_size = math.vec3();
    var u_fxaa_params = math.vec3();

    proto.on_apply = function (renderer, input, output) {
      u_inverse_filter_texture_size[0] = 1 / input.width;
      u_inverse_filter_texture_size[1] = 1 / input.height;
      this.shader.set_uniform("u_inverse_filter_texture_size", u_inverse_filter_texture_size);

      u_fxaa_params[0] = this.span_max;
      u_fxaa_params[1] = this.reduce_min;
      u_fxaa_params[2] = this.reduce_mul;

      this.shader.set_uniform("u_fxaa_params", u_fxaa_params);

      return input;
    };

    return fxaa;


  }, ge.effects.post_process);




  ge.effects.post_process.picture_adjustment = ge.define(function (proto, _super) {


    function picture_adjustment(params) {
      params = params || {};
      _super.apply(this);
      this.shader = ge.effects.post_process.picture_adjustment.shader;
      
      this.gamma = 1;
      this.contrast = 1;
      this.saturation = 1;
      this.brightness = 1;
      this.red = 1;
      this.green = 1;
      this.blue = 1;
      this.alpha = 1;
      fin.merge_object(params, this);

    }



    picture_adjustment.shader = ge.effects.post_process.shader.extend(glsl["pp-picture-adjustment"]);


    var u_pa_params = math.mat3();
    proto.on_apply = function (renderer, input, output) {
      u_pa_params[0] = this.gamma;
      u_pa_params[1] = this.contrast;
      u_pa_params[2] = this.saturation;
      u_pa_params[3] = this.brightness;
      u_pa_params[4] = this.red;
      u_pa_params[5] = this.green;
      u_pa_params[6] = this.blue;
      u_pa_params[7] = this.alpha;


      this.shader.set_uniform("u_pa_params", u_pa_params);
      return input;
    };

    return picture_adjustment;


  }, ge.effects.post_process);



  ge.effects.post_process.blank = ge.define(function (proto, _super) {


    function blank(params) {
      params = params || {};
      _super.apply(this);      
      Object.assign(this, params);

      if (params.on_init) params.on_init.apply(this);
    }

    proto.on_apply = function (renderer, input, output) {
    
      return input;
    };

    return blank;


  }, ge.effects.post_process);




  ge.effects.post_process.bloom = ge.define(function (proto, _super) {


    function bloom(params) {
      params = params || {};
      _super.apply(this);
      fin.merge_object(params, this);
      this.resolution = params.resolution || 0.5;
      this.resolution_last = this.resolution;
      this.blur_quality = params.blur_quality || 9;
      this.u_bright_threshold_rw = math.vec4(params.bright_threshold || [0.2627, 0.6780, 0.0593, -0.95]);

      this.blend_exposure = params.blend_exposure || 3;
      this.blend_gamma = params.blend_gamma || 0.5;
      this.blend_factor = params.blend_factor || 3.0;

      this.u_offset_rw = math.vec2();
      this.blur_kernel = math.vec3(5.0 / 16.0, 6 / 16.0, 5 / 16.0);
     

    }
    var u_glow_params_rw = math.vec3();
    proto.apply = function (renderer, input, output) {
      if (!this.targets) {
        this.targets = [
          new ge.webgl.render_target(renderer, renderer.render_width * this.resolution, renderer.render_height * this.resolution),
          new ge.webgl.render_target(renderer, renderer.render_width * this.resolution, renderer.render_height * this.resolution)
        ];

        this.targets[0].attach_color().color_texture.enable_linear_interpolation();
        this.targets[1].attach_color().color_texture.enable_linear_interpolation();
      }       

           

      this.targets[0].bind();      
      renderer.use_shader(ge.effects.post_process.bloom.emission);
      renderer.use_direct_texture(input, 0);
      renderer.active_shader.set_uniform("u_bright_threshold_rw", this.u_bright_threshold_rw);
      renderer.draw_full_quad();

     
      
      renderer.use_shader(ge.effects.post_process.bloom.blur_shader);
      renderer.active_shader.set_uniform("u_blurKernel_rw", this.blur_kernel);
      

      var t = 0;
      for (var i1 = 1; i < this.blur_quality; i++) {
        t = i % 2;
        this.targets[t].bind();
        renderer.use_direct_texture(this.targets[(t === 0 ? 1 : 0)].color_texture, 0);
        if (t === 0) {
          this.u_offset_rw[0] = (1 / (input.width / i));
          this.u_offset_rw[1] = 0;

        }
        else {
          this.u_offset_rw[1] = (1 / (input.height / i));
          this.u_offset_rw[0] = 0;
        }

        renderer.active_shader.set_uniform("u_offset_rw", this.u_offset_rw);
        renderer.draw_full_quad();
      }
      /*
      
  

 
  

this.bind_output(renderer, output);
      renderer.use_direct_texture(input, 0);
      renderer.use_shader(ge.effects.post_process.shader);
      renderer.draw_full_quad();
      */

     
      this.bind_output(renderer, output);
      renderer.use_direct_texture(input, 0);
      renderer.use_shader(ge.effects.post_process.bloom.shader);
      renderer.active_shader.set_uniform("u_glow_emission_rw", 5);

      u_glow_params_rw[0] = this.blend_exposure;
      u_glow_params_rw[1] = this.blend_gamma;
      u_glow_params_rw[2] = this.blend_factor;

      renderer.active_shader.set_uniform("u_glow_params_rw", u_glow_params_rw);
      renderer.use_direct_texture(this.targets[t].color_texture, 5);
      renderer.draw_full_quad();


      

    

     // renderer.draw_textured_quad(this.targets[t].color_texture, 0.35, 0.5, 0.35, 0.35);
      

    }

    bloom.shader = ge.effects.post_process.shader.extend(glsl["pp-bloom"]);
    bloom.blur_shader = ge.effects.post_process.shader.extend(glsl["pp-bloom-blur"]);
    bloom.emission = ge.effects.post_process.shader.extend(glsl["pp-bloom-emission"]);


    return bloom;


  }, ge.effects.post_process);







}})()(_FM["ge"],_FM["math"]);
(function() { return function debug(fin,ecs, ge,math) { 

  var glsl = ge.webgl.shader.create_chunks_lib(`/*chunk-points*/
<?=chunk('precision')?>
attribute vec3 a_point_position_rw;
attribute vec4 a_point_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;

varying vec3 point_color_v;

void vertex(){	    
    gl_Position = u_view_projection_rw*u_model_rw* vec4(a_point_position_rw,1.0);	
    point_color_v=a_point_color_rw.xyz;  
    gl_PointSize =a_point_color_rw.w;
}
<?=chunk('precision')?>

varying vec3 point_color_v;
void fragment(void) {	        
gl_FragColor.xyz=point_color_v;
gl_FragColor.w=1.0;
}



/*chunk-lines*/

<?=chunk('precision')?>
attribute vec3 a_line_position_rw;
attribute vec3 a_line_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;

varying vec3 line_color_v;

void vertex(){	    
    gl_Position = u_view_projection_rw*u_model_rw* vec4(a_line_position_rw,1.0);	
    line_color_v=a_line_color_rw.xyz;  
}
<?=chunk('precision')?>

varying vec3 line_color_v;
void fragment(void) {	        
gl_FragColor.xyz=line_color_v;
gl_FragColor.w=1.0;
}



/*chunk-triangles*/

<?=chunk('precision')?>
attribute vec3 a_triangle_position_rw;
attribute vec3 a_triangle_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;

varying vec3 triangle_color_v;

void vertex(){	    
    gl_Position = u_view_projection_rw*u_model_rw* vec4(a_triangle_position_rw,1.0);	
    triangle_color_v=a_triangle_color_rw.xyz;  
}
<?=chunk('precision')?>

varying vec3 triangle_color_v;
void fragment(void) {	        
gl_FragColor.xyz=triangle_color_v;
gl_FragColor.w=1.0;
}



/*chunk-aabbs*/

<?=chunk('precision')?>
attribute vec3 a_position_rw;
attribute vec3 a_box_position_rw;
attribute vec3 a_box_size_rw;
attribute vec3 a_box_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;
varying vec3 v_box_color_rw;
void vertex(){
    vec4 pos;
    pos.xyz=a_position_rw*a_box_size_rw;    
    pos.xyz+=a_box_position_rw;
    pos.w=1.0;    
    v_box_color_rw=a_box_color_rw;
    gl_Position = u_view_projection_rw*u_model_rw*pos;	

}
<?=chunk('precision')?>
varying vec3 v_box_color_rw;
void fragment(void) {	
gl_FragColor=vec4(v_box_color_rw,0.5);
}







/*chunk-aabbs-solid*/

<?=chunk('precision')?>
attribute vec4 a_position_rw;
attribute vec3 a_box_position_rw;
attribute vec3 a_box_size_rw;
attribute vec3 a_box_color_rw;

uniform mat4 u_view_projection_rw;
uniform mat4 u_model_rw;
varying vec3 v_box_color_rw;


void vertex(){
    vec4 p;
    p.xyz=a_position_rw.xyz*a_box_size_rw;    
    p.xyz+=a_box_position_rw;
    p.w=1.0;        
    v_box_color_rw=a_box_color_rw;
    gl_Position = u_view_projection_rw*u_model_rw*p;	
}
<?=chunk('precision')?>
varying vec3 v_box_color_rw;
void fragment(void) {	
gl_FragColor=vec4(v_box_color_rw,1.0);
}
`);

  ge.debug = {};

  ge.debug.points = ge.define(function (proto, _super) {

    var mat = new ge.shading.material();

    mat.shader = ge.webgl.shader.parse(glsl["points"]);

    mat.render_mesh = function (renderer, shader, mesh) {
      if (mesh.points_count < 1) return;

      renderer.gl.drawArrays(0, 0, mesh.points_count);
    };


    proto.clear = function () {
      this.points_position.i = 0;
      this.points_count = 0;
    };


    proto.add = (function () {
      var i = 0, _r = 1, _g = 1, _b = 1, _s = 10;
      proto.add_vec3 = function (v, r, g, b, s) {
        _r = r; _g = g; _b = b; _s = s;
        this.add(v[0], v[1], v[2], _r, _g, _b, _s);
      };

      return function (x, y, z, r, g, b, s) {
        _r = r; _g = g; _b = b; _s = s;
        i = this.points_position.i;
        this.points_position.data[i] = x;
        this.points_position.data[i + 1] = y;
        this.points_position.data[i + 2] = z;

        this.points_position.data[i + 3] = r;
        this.points_position.data[i + 4] = g;
        this.points_position.data[i + 5] = b;
        this.points_position.data[i + 6] = s;

        this.points_position.i += 7;

        this.points_position.data_length = this.points_position.i;
        this.points_position.needs_update = true;

        this.points_count = (this.points_position.i / 7);
        this.draw_count = this.points_count;
      }
    })();


    proto.update_bounds = function (mat) { };

    function ge_debug_points(def) {
      def = def || {};
      _super.apply(this, [def]);


      def.max_points = def.max_points || 1000;

      this.geometry = new ge.geometry.geometry_data();

      this.points_position = this.geometry.add_attribute("a_point_position_rw", {
        item_size: 3, data: new Float32Array(def.max_points * 3), stride: 7 * 4
      });
      this.points_color = this.geometry.add_attribute("a_point_color_rw", {
        item_size: 4, stride: 7 * 4, offset: 3 * 4,
      });
      this.points_position.i = 0;
      this.points_count = 0;
      this.material = new ge.shading.material();
      this.material.shader = mat.shader;
      this.material.render_mesh = mat.render_mesh;
      this.draw_offset = 0;
      this.draw_count = this.geometry.num_items;

      this.flags += 2;


    }

    return ge_debug_points;
  }, ge.geometry.mesh);




  ge.debug.lines = ge.define(function (proto, _super) {
    var mat = new ge.shading.material();

    mat.shader = ge.webgl.shader.parse(glsl["lines"]);

    mat.render_mesh = function (renderer, shader, mesh) {
      if (mesh.line_count < 1) return;
      renderer.gl.drawArrays(1, 0, mesh.line_count);
    };


    proto.clear = function () {
      this.line_position.i = 0;
      this.line_count = 0;
    };


    proto._add = (function () {
      var i = 0;

      proto.set_color = function (r, g, b) {
        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;
        return this;
      }

      proto.add_vec3 = function (v0, v1) {
        this._add(
          v0[0], v0[1], v0[2], this.color[0], this.color[1], this.color[2],
          v1[0], v1[1], v1[2], this.color[0], this.color[1], this.color[2]
        );
        return this;
      };

      proto.add2 = function (x0, y0, z0, x1, y1, z1) {
        this._add(
          x0, y0, z0, this.color[0], this.color[1], this.color[2],
          x1, y1, z1, this.color[0], this.color[1], this.color[2]
        )
      };
      proto.addtri = function (x0, y0, z0, x1, y1, z1, x2, y2, z2) {

        this.add2(x0, y0, z0, x1, y1, z1);
        this.add2(x1, y1, z1, x2, y2, z2);
        this.add2(x2, y2, z2,x0, y0, z0);


      };
      return function (x0, y0, z0, r0, g0, b0, x1, y1, z1, r1, g1, b1) {
        i = this.line_position.i;
        this.line_position.data[i] = x0;
        this.line_position.data[i + 1] = y0;
        this.line_position.data[i + 2] = z0;

        this.line_position.data[i + 3] = r0;
        this.line_position.data[i + 4] = g0;
        this.line_position.data[i + 5] = b0;

        this.line_position.data[i + 6] = x1;
        this.line_position.data[i + 7] = y1;
        this.line_position.data[i + 8] = z1;

        this.line_position.data[i + 9] = r1;
        this.line_position.data[i + 10] = g1;
        this.line_position.data[i + 11] = b1;

        this.line_position.i += 12;

        this.line_position.data_length = this.line_position.i;
        this.line_position.needs_update = true;

        this.line_count = (this.line_position.i / 6);
        this.draw_count = this.line_count;
      }
    })();


    proto.update_bounds = function (mat) { };

    function ge_debug_lines(def) {
      def = def || {};
      _super.apply(this, [def]);


      def.max_lines = def.max_lines || 8000;

      this.geometry = new ge.geometry.geometry_data();

      this.line_position = this.geometry.add_attribute("a_line_position_rw", {
        item_size: 3, data: new Float32Array(def.max_lines * 3 * 2), stride: 6 * 4
      });
      this.line_color = this.geometry.add_attribute("a_line_color_rw", {
        item_size: 3, stride: 6 * 4, offset: 3 * 4,
      });
      this.line_position.i = 0;
      this.line_count = 0;
      this.material = mat;
      this.draw_offset = 0;
      this.draw_count = this.geometry.num_items;
      this.color = [1, 1, 1];
      this.flags = 2;

    }

    return ge_debug_lines;
  }, ge.geometry.mesh);





  ge.debug.triangles = ge.define(function (proto, _super) {

    var mat = new ge.shading.material({ transparent: 0.5 });

    mat.shader = ge.webgl.shader.parse(glsl["triangles"]);

    mat.render_mesh = function (renderer, shader, mesh) {
      if (mesh.triangle_count < 1) return;
      renderer.gl_disable(2884);
      renderer.gl.drawArrays(4, 0, mesh.triangle_count*3);
      renderer.gl_enable(2884);
    };


    proto.clear = function () {
      this.triangle_position.i = 0;
      this.triangle_count = 0;
    };


    proto._add = (function () {
      var i = 0;

      proto.set_color = function (r, g, b) {
        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;
        return this;
      }

      proto.add_vec3 = function (v0, v1, v2) {
        this._add(
          v0[0], v0[1], v0[2], this.color[0], this.color[1], this.color[2],
          v1[0], v1[1], v1[2], this.color[0], this.color[1], this.color[2],
          v2[0], v2[1], v2[2], this.color[0], this.color[1], this.color[2]
        );
        return this;
      };

      proto.add2 = function (x0, y0, z0, x1, y1, z1, x2, y2, z2) {
        this._add(
          x0, y0, z0, this.color[0], this.color[1], this.color[2],
          x1, y1, z1, this.color[0], this.color[1], this.color[2],
          x2, y2, z2, this.color[0], this.color[1], this.color[2]
        )
      };

      return function (x0, y0, z0, r0, g0, b0, x1, y1, z1, r1, g1, b1, x2, y2, z2, r2, g2, b2) {
        i = this.triangle_position.i;
        this.triangle_position.data[i] = x0;
        this.triangle_position.data[i + 1] = y0;
        this.triangle_position.data[i + 2] = z0;

        this.triangle_position.data[i + 3] = r0;
        this.triangle_position.data[i + 4] = g0;
        this.triangle_position.data[i + 5] = b0;

        this.triangle_position.data[i + 6] = x1;
        this.triangle_position.data[i + 7] = y1;
        this.triangle_position.data[i + 8] = z1;

        this.triangle_position.data[i + 9] = r1;
        this.triangle_position.data[i + 10] = g1;
        this.triangle_position.data[i + 11] = b1;


        this.triangle_position.data[i + 12] = x2;
        this.triangle_position.data[i + 13] = y2;
        this.triangle_position.data[i + 14] = z2;

        this.triangle_position.data[i + 15] = r2;
        this.triangle_position.data[i + 16] = g2;
        this.triangle_position.data[i + 17] = b2;


        this.triangle_position.i += 18;

        this.triangle_position.data_length = this.triangle_position.i;
        this.triangle_position.needs_update = true;

        this.triangle_count = (this.triangle_position.i / 9);
        this.triangle_count = this.triangle_count;
      }
    })();



    proto.update_bounds = function (mat) { };

    function ge_debug_triangles(def) {
      def = def || {};
      _super.apply(this, [def]);


      def.max_triangles = def.max_triangles || 3000;

      this.geometry = new ge.geometry.geometry_data();


      this.triangle_position = this.geometry.add_attribute("a_triangle_position_rw", {
        item_size: 3, data: new Float32Array(def.max_triangles * 3 * 3), stride: 6 * 4
      });
      this.triangle_color = this.geometry.add_attribute("a_triangle_color_rw", {
        item_size: 3, stride: 6 * 4, offset: 3 * 4,
      });
      this.triangle_position.i = 0;
      this.triangle_count = 0;
      this.material = new ge.shading.material();

      this.material.shader = mat.shader;
      this.material.render_mesh = mat.render_mesh;
      this.draw_offset = 0;
      this.draw_count = this.geometry.num_items;
      this.color = [1, 1, 1];
      this.flags = 2;


    }

    return ge_debug_triangles;
  }, ge.geometry.mesh);




  ge.debug.aabbs = ge.define(function (proto, _super) {
    var mat = new ge.shading.material({ transparent: 0.5});

    mat.shader = ge.webgl.shader.parse(glsl["aabbs"]);

    mat.render_mesh = function (renderer, shader, mesh) {
      if (mesh.boxes_count < 1) return;
      renderer.gl_enable(2929);
      renderer.gl.ANGLE_instanced_arrays.drawArraysInstancedANGLE(1, 0, mesh.geometry.num_items, mesh.boxes_count);

    };


    proto.update_bounds = function (mat) { };

    proto.clear = function () {
      this.di = 0;
      this.boxes_count = 0;
    };


    proto.add_aabb = (function () {
      var x, y, z, sx, sy, sz

      proto.add_aabb2 = function (minx, miny, minz, maxx, maxy, maxz) {
        sx = maxx - minx;
        sy = maxy - miny;
        sz = maxz - minz;
        x = minx + sx * 0.5;
        y = miny + sy * 0.5;
        z = minz + sz * 0.5;
        this.add(x, y, z, sx, sy, sz);
      }

      return function (b) {
        sx = b[3] - b[0];
        sy = b[4] - b[1];
        sz = b[5] - b[2];
        x = b[0] + sx * 0.5;
        y = b[1] + sy * 0.5;
        z = b[2] + sz * 0.5;

        this.add(x, y, z, sx, sy, sz);
      }
    })();
    proto.add = (function () {
      
      return function (x, y, z, sx, sy, sz) {
       var i = this.di;
        this.boxes_position.data[i] = x;
        this.boxes_position.data[i + 1] = y;
        this.boxes_position.data[i + 2] = z;

        this.boxes_size.data[i] = sx;
        this.boxes_size.data[i + 1] = sy;
        this.boxes_size.data[i + 2] = sz;

        this.boxes_color.data[i] = 1;
        this.boxes_color.data[i + 1] = 0;
        this.boxes_color.data[i + 2] = 0;

        this.di += 3;

        this.boxes_position.data_length = this.di;
        this.boxes_position.needs_update = true;

        this.boxes_size.data_length = this.di;
        this.boxes_size.needs_update = true;

        this.boxes_color.data_length = this.di;
        this.boxes_color.needs_update = true;
        this.boxes_count = this.di / 3;
      }
    })();

    function ge_debug_aabbs(def) {
      def = def || {};
      _super.apply(this, [def]);
      def.max_boxes = def.max_boxes || 10000;
      var geo = ge_debug_aabbs.get_lines_geometry();

      this.boxes_position = geo.add_attribute("a_box_position_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });
      this.boxes_size = geo.add_attribute("a_box_size_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });

      this.boxes_color = geo.add_attribute("a_box_color_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });

      this.geometry = geo;
      this.material = mat;

      this.max_boxes = 0;
      this.di = 0;
      this.box_color = [0.5, 0.5, 0.5];

      this.flags =  2;
      return (this);


    }
    ge_debug_aabbs.get_lines_geometry = function () {
      var b = ge.geometry.geometry_data.lines_builder;
      b.clear();
      b.move_to(-0.5, -0.5, -0.5)
        .add_to(0.5, -0.5, -0.5)
        .add_to(0.5, 0.5, -0.5)
        .add_to(-0.5, 0.5, -0.5)
        .add_to(-0.5, -0.5, -0.5);

      b.move_to(-0.5, -0.5, -0.5).add_to(-0.5, -0.5, 0.5);
      b.move_to(0.5, -0.5, -0.5).add_to(0.5, -0.5, 0.5);

      b.move_to(-0.5, 0.5, -0.5).add_to(-0.5, 0.5, 0.5);
      b.move_to(0.5, 0.5, -0.5).add_to(0.5, 0.5, 0.5);

      b.move_to(-0.5, -0.5, 0.5)
        .add_to(0.5, -0.5, 0.5)
        .add_to(0.5, 0.5, 0.5)
        .add_to(-0.5, 0.5, 0.5)
        .add_to(-0.5, -0.5, 0.5);

      return b.build();
    }


    return ge_debug_aabbs;
  }, ge.geometry.mesh);



  ge.debug.aabbs_solid = ge.define(function (proto, _super) {

    proto.update_bounds = function (mat) { };

    proto.clear = function () {
      this.di = 0;
      this.boxes_count = 0;
    };


    proto.add_aabb = (function () {
      var x, y, z, sx, sy, sz

      proto.add_aabb2 = function (minx, miny, minz, maxx, maxy, maxz) {
        sx = maxx - minx;
        sy = maxy - miny;
        sz = maxz - minz;
        x = minx + sx * 0.5;
        y = miny + sy * 0.5;
        z = minz + sz * 0.5;
        this.add(x, y, z, sx, sy, sz);
      }

      return function (b) {
        sx = b[3] - b[0];
        sy = b[4] - b[1];
        sz = b[5] - b[2];
        x = b[0] + sx * 0.5;
        y = b[1] + sy * 0.5;
        z = b[2] + sz * 0.5;

        this.add(x, y, z, sx, sy, sz);
      }
    })();
    proto.add = (function () {

      return function (x, y, z, sx, sy, sz) {
        var i = this.di;
        this.boxes_position.data[i] = x;
        this.boxes_position.data[i + 1] = y;
        this.boxes_position.data[i + 2] = z;

        this.boxes_size.data[i] = sx;
        this.boxes_size.data[i + 1] = sy;
        this.boxes_size.data[i + 2] = sz;

        this.boxes_color.data[i] = this.box_color[0];
        this.boxes_color.data[i + 1] = this.box_color[1];
        this.boxes_color.data[i + 2] = this.box_color[2];

        this.di += 3;

        this.boxes_position.data_length = this.di;
        this.boxes_position.needs_update = true;

        this.boxes_size.data_length = this.di;
        this.boxes_size.needs_update = true;

        this.boxes_color.data_length = this.di;
        this.boxes_color.needs_update = true;
        this.boxes_count = this.di / 3;
      }
    })();

    proto.set_color = function (r, g, b) {
      this.box_color[0] = r;
      this.box_color[1] = g;
      this.box_color[2] = b;
      return this;
    }


    
    var shader = ge.webgl.shader.parse(glsl["aabbs-solid"]);
    function ge_debug_aabbs_solid(def) {
      def = def || {};
      _super.apply(this, [def]);
      def.max_boxes = def.max_boxes || 1000; 
      var geo = ge.geometry.shapes.cube();


      this.boxes_position = geo.add_attribute("a_box_position_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });
      this.boxes_size = geo.add_attribute("a_box_size_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });

      this.boxes_color = geo.add_attribute("a_box_color_rw", {
        item_size: 3, data: new Float32Array(def.max_boxes * 3), divisor: 1,
      });

      this.geometry = geo;
      this.material = new ge.shading.material();
      this.material.shader = shader;
      this.draw_count = this.geometry.num_items;
      this.di = 0;
      this.box_color = [0.5, 0.5, 0.5];

      this.flags = 2;

      return (this);


    }

    return ge_debug_aabbs_solid;
  }, ge.geometry.mesh);




}})()(_FM["fin"],_FM["ecs"],_FM["ge"],_FM["math"]);
_FM["myapp"]=new Object();
(function(){ return function (fin, math, ecs, ge, bvh, gltf) {
          

          function unpack_zip(data, cb, types) {
              types = types || {};
              var unpacked = {};

              JSZip.loadAsync(data).then(function (zip) {


                  var files = Object.keys(zip.files);

                  fin.each_index(function (i, next) {
                      zip.file(files[i]).async(types[files[i]] || "blob").then(function (data) {
                          unpacked[files[i]] = data;
                          if (i < files.length - 1)
                              next(i + 1);
                          else setTimeout(cb, 100, unpacked);

                      });

                  });

              });
          }

          function RD(a) {
              return a * 0.017453292519943295;
          }
          var elm$ = (function () {
              var _html$ = document.createElement('div');
              var e$;
              return function (html) {
                  _html$.innerHTML = html;
                  e$ = _html$.firstChild;
                  _html$.removeChild(e$);
                  return e$;
              }
          })();
          var dapp = elm$('<div style="width:100%;height:calc(100%);position:absolute;left:0%;top:0%;"></div>');

          document.body.appendChild(dapp);
          var app = new ge.app({
              renderer: {
                  pixel_ratio: 1,

              },
              host: dapp
          });
          window.onresize = function () {
              app.render_system.resize();
          }


          var camera = app.render_system.camera;









        



          function test1() {
              console.log(app);


              var lg1= app.create_renderable(new ge.shading.light({
                  intensity: 1,
                  ambient: [0.85, 0.85, 0.85]
              }),
                  function (m, e) {
                      e.transform.set_eular(RD(-60), RD(20), 0);
                      m.enable_shadows({
                          shadow_intensity: 0.2,
                          shadow_map_size: 2048,
                          shadow_camera_distance: 15
                      })

                  });

              lg1.ge_renderable.items[0].is_lg = true;


              fin.url_loader(["wireless-system.zip"], function (data) {
                  var mats = {
                      'chairs': {
                          cast_shadows: true
                      },
                      'kitchentable': {
                          cast_shadows: true
                      },
                      'tvtable': {
                          cast_shadows: true
                      },
                      'sofatable': {
                          cast_shadows: true
                      },


                      'frontwall': {
                          transparent: 0.35,
                          specular1: [2, 2, 2],
                          ambient: [0.82, 0.82, 0.82],
                          transparent_layer: 10,
                          diffuse: [0, 0, 0]
                      },
                      'floor': {
                          receive_shadows: true,
                          ambient: [112 / 255, 123 / 255, 124 / 255],
                          diffuse: [0.5, 0.5, 0.5],
                          specular: [0, 0, 0]
                      }


                  };

                  var objects = {}, meshes = [lg1.ge_renderable.items[0]];
                  console.log(objects);

                  function ar_features() {

                      var tw = 1280 / 2;
                      var th = 720 / 2;

                    

                      function start_ar(video) {
                          var cameraParam = new ARCameraParam();
                          var arController = null;
                          var ww = video.videoWidth;
                          var hh = video.videoHeight;
                          var ra = (window.innerWidth / ww);
                          ww *= ra;
                          hh *= ra;


                          dapp.style.width = ww + "px";
                          dapp.style.height = hh + "px";
                          setTimeout(function () {
                              app.render_system.resize();
                          }, 100);

                          // app.render_system.set_size(video.videoWidth, video.videoHeight);
                          cameraParam.onload = async function () {
                              arController = new ARController(video.videoWidth, video.videoHeight, cameraParam);
                              console.log(arController);
                              //14: -0.20000100135803223
                              var cpm = arController.getCameraMatrix();
                              // cpm[10] = -1.0000100135803223;
                              // cpm[14] = -0.20000100135803223;

                              //  cpm[10] *= cpm[10];
                              //  cpm[14] *= cpm[14];

                              var a00 = 1.0 / Math.tan(45 / 2);
                              cpm[0] = a00 / (ww / hh);
                              cpm[14] = -0.20000100135803223;
                              cpm[10] = -1.0000100135803223;
                              arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);
                              //camera.ge_camera.set_freez_projection(cpm);
                          };
                          cameraParam.load('camera_para-iPhone.dat');
                          var video_textre = new ge.webgl.canvas_texture(video.videoWidth, video.videoHeight);
                          app.render_system.scene_render.add(function () {
                              app.render_system.renderer.draw_textured_quad(video_textre, 0, 0, 1, 1);
                          });
                          var isVisible = false;
                          var markerMatrix = new Float64Array(12);
                          var trans = app.root.transform;

                          var tmp = math.mat4(), markerNum = 0;

                          var tmat = math.mat4();
                          math.mat4.identity(tmat);

                          var lgmat = math.mat4();
                          math.mat4.identity(lgmat);

                          tmat[12] =0;

                          math.mat4.from_quat(lgmat, lg1.transform.rot);

                          var ppos = [], prot = [], pscale = [], qt = [], sc = [0.0018, 0.0018, 0.0018];
                          var qrot = [], qrx = 0, qry = 0, qrz =0;

                          function updatetmat() {
                              math.quat.rotate_eular(qrot, qrx, qry, qrz);
                              math.mat4.from_quat(tmat, qrot);
                              math.mat4.scale(tmat, sc);
                          }


                          app.attach_component(camera, 'ge_mouse_camera_controller', {
                              element: app.render_system.renderer.canvas,
                              wheel_delta: 0.01,
                              on_mouse_down: function (x, y, e) {
                                  camera.ge_camera.is_locked = true;
                              },
                              on_mouse_drage: function (dx, dy, e) {
                                  qrx += 0.004 * dy;
                                  qry += 0.004 * dx;
                                  updatetmat();

                              },
                              on_mouse_wheel: function (sp) {
                                  sc[0] += (0.0000005 * sp);
                                  sc[1] = sc[0];
                                  sc[2] = sc[0];

                                  updatetmat();

                              }
                          });

                          updatetmat();

                          setInterval(function () {



                              if (!arController) {
                                  return;
                              }
                              video_textre.ctx.save();
                              video_textre.ctx.translate(0, video_textre.canvas.height);
                              video_textre.ctx.scale(1, -1);
                              video_textre.ctx.drawImage(video, 0, 0);


                              video_textre.ctx.restore();

                              video_textre.update();

                              arController.detectMarker(video);
                              markerNum = arController.getMarkerNum();


                              if (markerNum > 0) {

                                  if (isVisible) {
                                      arController.getTransMatSquareCont(0, 1, markerMatrix, markerMatrix);
                                  } else {
                                      arController.getTransMatSquare(0 /* Marker index */, 1 /* Marker width */, markerMatrix);
                                  }

                                  isVisible = true;



                                  // arController.arglCameraViewRHf(arController.transMatToGLMat(m1.markerMatrix), m1.ge_renderable.items[0].matrix_world);

                                  arController.arglCameraViewRHf(arController.transMatToGLMat(markerMatrix), tmp);
                                  /*
                                  math.mat4.get_rotation(trans.rotation, tmp);
                                  math.mat4.get_translation(trans.position, tmp);
                                  math.mat4.get_scaling(trans.scale, tmp);
                                  trans.require_update = 1;
                                  */

                                  // math.mat4.get_rotation(prot, tmp);
                                  math.mat4.get_translation(ppos, tmp);
                                  //  math.mat4.get_scaling(pscale, tmp);
                                  // math.quat.rotate_eular(qt, prot[0], prot[1], prot[2]);
                                  // math.mat4.from_quat(tmp, prot);

                                  math.mat4.identity(tmp);
                                  //   math.mat4.scale(tmp, pscale);
                                  tmp[12] = ppos[0]; tmp[13] = ppos[1]; tmp[14] = ppos[2];

                                  //trans.sys.set_pos(trans, ppos[0], ppos[1], ppos[2]);
                                  math.mat4.multiply(tmp, tmp, tmat);

                                  // math.mat4.multiply(tmp, tmp, tmat);
                                  meshes.forEach(function (m) {
                                      if (m.is_lg) {

                                          math.mat4.multiply(m.matrix_world, tmp, lgmat);
                                      }
                                      else {
                                          m.matrix_world = tmp;
                                          // m.matrix_world[12] = tmp[12];
                                          // m.matrix_world[13] = tmp[13];
                                          // m.matrix_world[14] = tmp[14];

                                      }

                                      //
                                  });

                              } else {
                                  isVisible = false;

                              }



                          }, 50);
                      }

                      ARController.getUserMedia({
                          maxARVideoSize: 320,
                          facing: "environment",
                          onSuccess: start_ar
                      });




                  }

                  function start_sim() {
                      app.create_renderable(new ge.geometry.mesh({
                          geometry: ge.geometry.geometry_data.create({
                              attr: {
                                  "a_tm_rw": {
                                      data: ge.geometry.geometry_data.create_float32_timeline(50),
                                      item_size: 1
                                  }
                              }
                          }), material: new ge.shading.material({
                              draw_type1: 3,
                              draw_type: 0,
                          })
                      }),
                          function (m, e) {
                              meshes.push(m);
                              e.transform.set_parent(app.root.transform);


                              m.material.shader = m.material.shader.extend(`
uniform float u_timer_rw;
uniform vec3 u_up_rw;
uniform vec3 u_start_rw;
uniform vec4 u_dir_rw;

uniform vec3 u_wave_params;

uniform vec3 u_view_sd;
uniform vec3 u_view_up;

uniform vec3 u_view_fw;

attribute float a_tm_rw;
void vertex(){
float speed=u_wave_params.x; //0.05
float tension=u_wave_params.y; //0.20
float height=u_wave_params.z; //3.0

float l=u_dir_rw.w;
vec4 pos=vec4(u_dir_rw.xyz*(l*a_tm_rw),1.0);

float anim=(u_timer_rw*(-l*speed));
pos.xyz+=u_up_rw*(sin((l*(a_tm_rw*tension))+anim)*height);

pos.xyz += u_start_rw;
pos=u_model_rw*pos;
 //pos.xyz =  u_view_sd * pos.x  + u_view_up * pos.y ;



 gl_Position=u_view_projection_rw*(pos);
gl_PointSize =max( 9.0 / gl_Position.w, 1.0);
gl_PointSize =2.0;
}

uniform vec4 u_draw_color;

void fragment(){
gl_FragColor=u_draw_color;

}

`);


                              var ewave_params = math.vec3([0.05, 0.10, 8]);
                              var ewave_color = math.vec4(1, 1, 1, 1);


                              var swave_params = math.vec3([0.02, 0.50, 4]);
                              var swave_color = math.vec4(1, 0, 0, 1);

                              m.instances = [
                                  {
                                      start: objects["device1_device1_devices"].origin,
                                      end: objects["11643_microwave_v1_l3_11643_microwave_v1_l3_microwave"].origin,
                                      params: ewave_params,
                                      draw_color: ewave_color,
                                      draw_type: 3



                                  },

                                  {
                                      start: objects["device1_device1_devices"].origin,
                                      end: objects["11643_microwave_v1_l3_11643_microwave_v1_l3_microwave"].origin,
                                      params: swave_params,
                                      draw_color: swave_color,




                                  },


                                  {
                                      start: objects["device1_device1_devices"].origin,
                                      end: objects["toaster_toaster_toaster"].origin,
                                      params: ewave_params,
                                      draw_color: ewave_color,
                                      draw_type: 3
                                  },

                                  {
                                      start: objects["device1_device1_devices"].origin,
                                      end: objects["toaster_toaster_toaster"].origin,
                                      params: swave_params,
                                      draw_color: swave_color,
                                  },



                                  {
                                      start: objects["device2_device2_devices"].origin,
                                      end: objects["laptop_laptop_LaptopMat"].origin,
                                      params: ewave_params,
                                      draw_color: ewave_color,
                                      draw_type: 3
                                  },

                                  {
                                      start: objects["device2_device2_devices"].origin,
                                      end: objects["laptop_laptop_LaptopMat"].origin,
                                      params: swave_params,
                                      draw_color: swave_color,
                                  },

                                  {
                                      start: objects["device2_device2_devices"].origin,
                                      end: objects["tv_tv_tv"].origin,
                                      params: ewave_params,
                                      draw_color: ewave_color,
                                      draw_type: 3
                                  },

                                  {
                                      start: objects["device2_device2_devices"].origin,
                                      end: objects["tv_tv_tv"].origin,
                                      params: swave_params,
                                      draw_color: swave_color,
                                  }


                              ];




                              m.geometry.num_items = m.geometry.attributes.a_tm_rw.data.length;
                              console.log(m);
                              m.flags += 2;
                              m.material.complete_render_mesh = (function (_super) {
                                  var i, ins, mm = math.mat4(), default_color = math.vec4(1, 1, 1, 1);
                                  return function (renderer, shader, mesh) {
                                      for (i = 0; i < mesh.instances.length; i++) {
                                          ins = mesh.instances[i];
                                          if (!ins.dir) {
                                              //  math.vec3.scale(ins.start, ins.start, 0.1);
                                              //  math.vec3.scale(ins.end, ins.end, 0.1);

                                              ins.dir = math.vec4();
                                              ins.up = math.vec3();
                                              math.mat4.target_to(mm, ins.start, ins.end, [0, 1, 0]);
                                              math.mat4.up_vector(ins.up, mm);
                                              math.vec3.subtract(ins.dir, ins.end, ins.start);
                                              ins.dir[3] = math.vec3.get_length(ins.dir);
                                              math.vec3.normalize(ins.dir, ins.dir);
                                              //  ins.draw_type = ins.draw_type || 3;




                                              console.log(ins);
                                          }


                                          shader.set_uniform('u_up_rw', ins.up);
                                          shader.set_uniform('u_start_rw', ins.start);
                                          shader.set_uniform('u_dir_rw', ins.dir);
                                          shader.set_uniform('u_draw_color', ins.draw_color);
                                          shader.set_uniform('u_wave_params', ins.params);


                                          // renderer.gl.drawArrays(0, 0, this.final_draw_count);

                                          renderer.gl.drawArrays(ins.draw_type, 0, this.final_draw_count);

                                          // renderer.gl.drawArrays(3, 0, this.final_draw_count);


                                      }

                                      // 




                                  }
                              })(m.material.complete_render_mesh);


                          });


                      var btn = elm$('<button  style="font-size:200%;position:absolute;left:50%;top:50%;width:200px;margin-left:-100px">OPEN AR</button>')

                      document.body.appendChild(btn);
                      btn.onclick = function () {
                          ar_features();
                          document.body.removeChild(btn);
                      }
                      
                  }
                  unpack_zip(data, function (zip) {

                      var g = ge.geometry.shapes.obj.parse(zip["wireless-system.obj"], zip["wireless-system.mtl"]);
                      console.log(g);
                      g.center_pivot(1, 1, 1, 0, 0, 0);
                      g.scale_position_rotation(1, 1, 1, 200, 0, 0, 0, RD(90), 0)
                      var materials = {};



                      g.obj_meta.materials.forEach(function (mat) {
                          // mat.wireframe = true;
                          mat.ambient = mat.ambient || [0.5, 0.5, 0.5];
                          mat.ambient = mat.diffuse;

                          if (mats[mat.name]) {
                              Object.assign(mat, mats[mat.name]);
                          }
                          materials[mat.name] = new ge.shading.shaded_material(mat);
                      });



                      var renderables = [];
                      g.obj_meta.meshes.forEach(function (ms) {
                          var m = new ge.geometry.mesh({
                              geometry: g,
                              material: materials[ms.mat],
                              draw_offset: ms.draw_offset,
                              draw_count: ms.draw_count
                          });
                          m.mat = ms.mat;
                          objects[ms.name] = m;
                          renderables.push(m);
                          m.origin = g.find_origin(ms.draw_offset, ms.draw_count);
                          meshes.push(m);
                          //console.log(m);
                      });




                      var e = app.create_renderables(renderables, function (m, e) {
                        
                      });

                      e.transform.set_parent(app.root.transform);
                      start_sim();
                      console.log(e);

                  }, {
                      "wireless-system.obj": "string",
                      "wireless-system.mtl": "string"
                  });

              }, "arraybuffer");
             
          }

          test1();

          app.start(function () {
              
          }, 1 / 60);

      }})().apply(_FM["myapp"],[_FM["fin"],_FM["math"],_FM["ecs"],_FM["ge"],_FM["bvh"],_FM["gltf"]]);
 return _FM;})()