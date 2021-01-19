/**
 * cityPicker
 * v-1.1.4
 * dataJson			[Json]						json数据，是html显示的列表数据
 * selectpattern	[Array]						用于存储的字段名和默认提示 { 字段名，默认提示 }
 * shorthand		[Boolean]					用于城市简写功能，默认是不开启(false)
 * storage			[Boolean]					存储的值是数字还是中文，默认是(true)数字
 * autoSelected     [Boolean]                   是否自动选择第一项，默认(true)
 * renderMode		[Boolean]					是模拟的还是原生的;只在type是selector才有效,默认是(true)模拟
 * keyboard         [Boolean]                   是否开启键盘操作事件，默认(false)
 * code				[Boolean]					是否输出城市区号值，默认(false)，开启就是传字段名('code')
 * search           [Boolean]                   是否开启搜索功能，默认（true）
 * level			[Number]					多少列  默认是一列/级 (3)
 * onInitialized	[Attachable]				组件初始化后触发的回调函数
 * onClickBefore	[Attachable]				组件点击显示列表触发的回调函数(除原生select)
 * onForbid         [Attachable]                存在class名forbid的禁止点击的回调
 * choose-xx		[Attachable]				点击组件选项后触发的回调函数 xx(级名称/province/city/district)是对应的级的回调
 */

(function ($, window) {
    var $selector;
    var grade = ['province', 'city', 'district'];
    var defaults = {
        dataJson: null,
        selectpattern: [{
                field: 'userProvinceId',
                placeholder: '请选择省份'
            },
            {
                field: 'userCityId',
                placeholder: '请选择城市'
            },
            {
                field: 'userDistrictId',
                placeholder: '请选择区县'
            }
        ],
        shorthand: false,
        storage: true,
        autoSelected: true,
        renderMode: true,
        keyboard: false,
        code: false,
        search: true,
        level: 3,
        onInitialized: function () {},
        onClickBefore: function () {},
        onForbid: function () {}
    };

    function Citypicker(options, selector) {
        this.options = $.extend({}, defaults, options);
        this.$selector = $selector = $(selector);
        this.values = [];
        this.province = this.city = this.district = '';

        this.init();
        this.bindEvent();
    }

    //功能模块函数
    var effect = {
        montage: function (data, pid, reg) {
            var self = this,
                config = self.options,
                leng = data.length,
                html = '',
                code, name, storage;

            for (var i = 0; i < leng; i++) {
                if (data[i].parentId === pid) {
                    //判断是否要输出区号
                    code = config.code && data[i].cityCode !== '' ? 'data-code=' + data[i].cityCode : '';
                    //判断是否开启了简写，是就用输出简写，否则就输出全称
                    name = config.shorthand ? data[i].shortName : data[i].name;
                    //存储的是数字还是中文
                    storage = config.storage ? data[i].id : name;

                    if (config.renderMode) {
                        //模拟
                        html += '<li class="caller" data-id="' + data[i].id + '" data-title="' + name + '" ' + code + '>' + name + '</li>';
                    } else {
                        //原生
                        html += '<option class="caller" value="' + storage + '" data-id="' + data[i].id + '" data-title="' + name + '" ' + code + '>' + name + '</option>';
                    }
                }
            }

            html = data.length > 0 && html ? html : '<li class="forbid">您查找的没有此城市...</li>';

            return html;
        },
        seTemplet: function () {
            var config = this.options,
                selectemplet = '',
                placeholder, field, forbid, citygrade, active, hide,
                searchStr = config.search ? '<div class="selector-search">'
                    +'<input type="text" class="input-search" value="" placeholder="拼音、中文搜索" />'
                +'</div>' : '';

            for (var i = 0; i < config.level; i++) { //循环定义的级别
                placeholder = config.selectpattern[i].placeholder; //默认提示语
                field = config.selectpattern[i].field; //字段名称
                citygrade = grade[i]; //城市级别名称
                forbid = i > 0 ? 'forbid' : ''; //添加鼠标不可点击状态
                active = i < 1 ? 'active' : ''; //添加选中状态
                hide = i > 0 ? ' hide' : ''; //添加隐藏状态

                if (config.renderMode) {
                    //模拟
                    selectemplet += '<div class="selector-item storey ' + citygrade + '" data-index="' + i + '">'
                        +'<a href="javascript:;" class="selector-name reveal df-color ' + forbid + '">' + placeholder + '</a>'
                        +'<input type=hidden name="' + field + '" class="input-price val-error" value="" data-required="' + field + '">'
                        +'<div class="selector-list listing hide">'+ searchStr +'<ul></ul></div>'
                    +'</div>';
                } else {
                    //原生
                    selectemplet += '<select name="' + field + '" data-index="' + i + '" class="' + citygrade + '">'
                        +'<option>' + placeholder + '</option>'
                    +'</select>';
                }
            }

            return selectemplet;
        },
        obtain: function (event) {
            var self = this,
                config = self.options,
                $selector = self.$selector,
                $target = config.renderMode ? event[0].target ? $(event[0].target) : $(event) : $(event.target),
                $parent = $target.parents('.listing'),
                $selected = $target.find('.caller:selected'),
                index = config.renderMode ? $target.parents('.storey').data('index') : $target.data('index'),
                id = config.renderMode ? $target.attr('data-id') : $selected.attr('data-id'),
                name = config.renderMode ? $target.text() : $selected.text(),
                storage = config.storage ? id : name, //存储的是数字还是中文
                code = config.renderMode ? $target.data('code') : $selected.data('code'),
                placeholder = index+1 < config.level ? config.selectpattern[index+1].placeholder : '',
                placeStr = !config.renderMode ? '<option class="caller">'+placeholder+'</option>'+ effect.montage.apply(self, [config.dataJson, id]) : '<li class="caller hide">'+placeholder+'</li>'+ effect.montage.apply(self, [config.dataJson, id]),
                autoSelectedStr = !config.autoSelected ? placeStr : effect.montage.apply(self, [config.dataJson, id]),
                $storey = $selector.find('.storey').eq(index + 1),
                $listing = $selector.find('.listing').eq(index + 1),
                values = { 'id': id || '0', 'name': name };

            // 存储选择的值
            if (index === 0) {
                self.province = '';
                self.province = values;
            } else if (index === 1) {
                self.city = '';
                self.city = values;
            } else if (index === 2) {
                self.district = '';
                self.district = values;
            }

            //选择选项后触发自定义事件choose(选择)事件
            $selector.trigger('choose-' + grade[index] +'.citypicker', [$target, values]);

            //赋值给隐藏域-区号
            $selector.find('[role="code"]').val(code);

            if (config.renderMode) {
                
                config.search ? $parent.find('.input-search').blur() : '';

                //给选中的级-添加值和文字
                $parent.siblings('.reveal').removeClass('df-color forbid').text(name).siblings('.input-price').val(storage);
                $listing.data('id', id).find('ul').html(autoSelectedStr).find('.caller').eq(0).trigger('click');

                if (!config.autoSelected) {
                    $storey.find('.reveal').text(placeholder).addClass('df-color').siblings('.input-price').val('');
                    $listing.find('.caller').eq(0).remove();
                }

                //模拟: 添加选中的样式
                $parent.find('.caller').removeClass('active');
                $target.addClass('active');
            } else {
                //原生: 下一级附上对应的城市选项，执行点击事件
				$target.next().html(autoSelectedStr).trigger('change').find('.caller').eq(0).prop('selected', true);
            }
        },
        show: function (event) {
            var config = this.options,
                $target = $(event);
            $selector = this.$selector;

            $selector.find('.listing').addClass('hide');
            $target.siblings('.listing').removeClass('hide').find('.input-search').focus();

            //点击的回调函数
            config.onClickBefore.call($target);
        },
        hide: function (event) {
            var config = this.options,
                $target = $(event);

            effect.obtain.call(this, $target);

            $selector.find('.listing').addClass('hide');

            return false;
        },
        search: function (event) {
            event.preventDefault();
            var self = this,
                $target = $(event.target),
                $parent = $target.parents('.listing'),
                inputVal = $target.val(),
                id = $parent.data('id'),
                keycode = event.keyCode,
                result = [];

            //如果是按下shift/ctr/左右/command键不做事情
            if (keycode === 16 || keycode === 17 || keycode === 18 || keycode === 37 || keycode === 39 || keycode === 91 || keycode === 93) {
                return false;
            }

            //如果不是按下enter/上下键的就做搜索事情
            if (keycode !== 13 && keycode !== 38 && keycode !== 40) {
                $.each(this.options.dataJson, function(key, value) {
                    //拼音或者名称搜索
                    if(value.pinyin.toLocaleLowerCase().search(inputVal) > -1 || value.name.search(inputVal) > -1 || value.id.search(inputVal) > -1 ){
                        result.push(value);
                    }
                });

                $parent.find('ul').html(effect.montage.apply(self, [result, id]));
            }
        },
        operation: function (event) {
            event.preventDefault();
            var $target = $(event.target),
                $sibl = $target.hasClass('input-search') ? $target.parents('.listing') : $target.siblings('.listing'),
                $items = $sibl.find('.caller'),
                keyCode = event.keyCode,
                index = 0,
                direction,
                itemIndex;
            
            //按下enter键
            if (keyCode === 13) {
                effect.hide.call(this, $sibl.find('.caller.active'));
                return false;
            }
            
            //按下上下键
            if (keyCode === 38 || keyCode === 40) {

                //方向
                direction = keyCode === 38 ? -1 : 1;
                //选中的索引
                itemIndex = $items.index($sibl.find('.caller.active'));

                if (itemIndex < 0) {
                    index = direction > 0 ? -1 : 0;
                } else {
                    index = itemIndex;
                }

                //键盘去选择的索引
                index = index + direction;

                //循环选择
                index = index === $items.length ? 0 : index;

                $items.removeClass('active').eq(index).addClass('active');

                //滚动条跟随定位
                effect.position.call(this, $sibl);
            }

            return false;
        },
        position: function (event) {
            var $target = event,
                $caller = $target.find('.caller.active'),
                oh = $target.outerHeight(),
                ch = $caller.outerHeight(),
                dy = $caller.position().top,
                sy = $target.find('ul').scrollTop();

            $target.find('ul').animate({
                scrollTop: dy + ch - oh + sy
            }, 200);
        }
    };

    Citypicker.prototype = {
        init: function () {
            var self = this,
                config = self.options,
                code = config.code ? '<input type="hidden" role="code" name="' + config.code + '" value="">' : '';
                //是否开启存储区号，是就加入一个隐藏域

            //添加拼接好的模板
            $selector.html(effect.seTemplet.call(self) + code);

            //html模板
            if (config.renderMode) {
                //模拟>添加数据
                $selector.find('.listing').data('id', '100000').eq(0).find('ul').html(effect.montage.apply(self, [config.dataJson, '100000']));
            } else {
                //原生>添加数据
                $selector.find('.province').append(effect.montage.apply(self, [config.dataJson, '100000']));
            }

            //初始化后的回调函数
            config.onInitialized.call(self);
        },
        bindEvent: function () {
            var self = this,
                config = self.options;

            //点击显示对应的列表
            $selector.on('click.citypicker', '.reveal', function (event) {
                event.preventDefault();
                var $this = $(this);

                if ($this.is('.forbid')) {

                    config.onForbid.call($this);

                    return false;
                }

                effect.show.call(self, $this);

                return false;
            });

            //点击选项事件
            $selector.on('click.citypicker', '.caller', $.proxy(effect.hide, self));

            //原生选择事件
            $selector.on('change.citypicker', 'select', $.proxy(effect.obtain, self));

            //文本框搜索事件
            $selector.on('keyup.citypicker', '.input-search', $.proxy(effect.search, self));

            //开启键盘操作
            if (config.keyboard) {
                //键盘选择事件
                $selector.on('keyup.citypicker', '.storey', $.proxy(effect.operation, self));
            }
        },
        unBindEvent: function (event) {
            var self = this,
                config = self.options;

            if (!config.renderMode) {
                $selector.off('change.citypicker', 'select');
                return false;
            }

            $selector.off('click.citypicker', '.reveal');

            $selector.off('click.citypicker', '.caller');

            $selector.off('keyup.citypicker', '.input-search');

            $selector.off('keyup.citypicker', '.storey');

        },
        setCityVal: function (val) {
            var self = this,
                config = self.options,
                arrayVal = val;

            self.values = [];

            $.each(arrayVal, function (key, value) {
                var $original = $selector.find('.'+grade[key]);
                var $forward = $selector.find('.'+grade[key+1]);

                if (config.renderMode) {
                    $original.find('.reveal').text(value.name).removeClass('df-color forbid').siblings('.input-price').val(value.id);

                    $forward.find('ul').html(effect.montage.apply(self, [config.dataJson, value.id]));
                    $original.find('.caller[data-id="'+value.id+'"]').addClass('active');
                } else {
                    $forward.html(effect.montage.apply(self, [config.dataJson, value.id]));
                    $original.find('.caller[data-id="'+value.id+'"]').prop('selected', true);
                }

                // 存储选择的值
                self.values.push({ 'id': value.id, 'name': value.name });
                
            });
        },
        getCityVal: function () {
            var self = this,
                $selector = self.$selector,
                id = $selector;

            if (self.province) {
                self.values = [];
                self.values.push(self.province, self.city, self.district);
            }
            
            return self.values;
        },
        changeStatus: function (status) {
            var self = this,
                config = self.options;

            if (status === 'readonly') {
                self.$selector.find('.reveal').addClass('forbid').siblings('.input-price').prop('readonly', true);
            } else if (status === 'disabled') {
                self.$selector.find('.reveal').addClass('disabled').siblings('.input-price').prop('disabled', true);

                !config.renderMode ? self.$selector.find('select').prop('disabled', true) : '';
            }

            config.renderMode && status !== 'readonly' ? self.unBindEvent() : '';
        }
    };

    //模拟：执行点击区域外的就隐藏列表;
	$(document).on('click.citypicker', function (event){
		if($selector && $selector.find(event.target).length < 1) {
			$selector.find('.listing').addClass('hide');
		}
    });

    $.fn.cityPicker = function (options) {
        return new Citypicker(options, this);
    };

})(jQuery, window);