'use strict';

//var vConsole = new VConsole();

const IDLE_MOTION_DURATION = 60000;

const contents = {
    moc: './assets/Tsumugi/Tsumugi.moc3',
    texture: './assets/Tsumugi/Tsumugi.2048/texture_00.png',
    idle_motions: [
        { name: "normal_idle", file: './assets/Tsumugi/normal_idle.motion3.json' },
        { name: "angry_idle", file: './assets/Tsumugi/angry_idle.motion3.json' },
        { name: "sad_idle", file: './assets/Tsumugi/sad_idle.motion3.json' },
        { name: "happy_idle", file: './assets/Tsumugi/happy_idle.motion3.json' },
        { name: "shy_idle", file: './assets/Tsumugi/shy_idle.motion3.json' },
    ],
    onetime_motions: [
        { name: "angry", file: './assets/Tsumugi/angry.motion3.json' },
        { name: "comical1", file: './assets/Tsumugi/comical1.motion3.json' },
        { name: "comical2", file: './assets/Tsumugi/comical2.motion3.json' },
        { name: "happy", file: './assets/Tsumugi/happy.motion3.json' },
        { name: "sad", file: './assets/Tsumugi/sad.motion3.json' },
        { name: "shy", file: './assets/Tsumugi/shy.motion3.json' },
        { name: "surprise", file: './assets/Tsumugi/surprise.motion3.json' },
    ],
};

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',

    },
    computed: {
    },
    methods: {
        live2d_clicked: function(){
            var index = Math.floor(Math.random() * contents.onetime_motions.length);
            live2d_set_onetime_motion(contents.onetime_motions[index].name);
        },
    },
    created: function(){
    },
    mounted: async function(){
        proc_load();

        try{
            await live2d_init("#live2d", contents, 'normal_idle');

            setInterval(()=>{
                var index = Math.floor(Math.random() * contents.idle_motions.length);
                live2d_set_idle_motion(contents.idle_motions[index].name);
            }, IDLE_MOTION_DURATION);
        }catch(error){
            console.log(error);
            alert(error);
        }
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );

var live2d_model = null;
var live2d_loader = null;
var live2d_motion = null;
var live2d_motion_onetime = false;

function live2d_set_onetime_motion(name){
    if( live2d_model == null )
        return;

    var motion = live2d_model.animator.getLayer("base");
    motion.stop();
    live2d_motion_onetime = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(live2d_loader.resources[name].data);
    motion.play(live2d_motion_onetime);
    live2d_motion_onetime = true;
}

function live2d_set_idle_motion(name){
    if( live2d_model == null )
        return;

    var motion = live2d_model.animator.getLayer("base");
    motion.stop();
    if( name ){
        live2d_motion_onetime = false;
        live2d_motion = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(live2d_loader.resources[name].data);
        motion.play(live2d_motion);
    }else{
        live2d_motion = null;
    }
}

function live2d_init(target, contents, first_motion){
    var loader = new PIXI.loaders.Loader();
    loader
        .add('moc', contents.moc, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER })
        .add('texture', contents.texture);
    for( var i = 0 ; i < contents.idle_motions.length ; i++ )
        loader.add(contents.idle_motions[i].name, contents.idle_motions[i].file, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
    for( var i = 0 ; i < contents.onetime_motions.length ; i++ )
        loader.add(contents.onetime_motions[i].name, contents.onetime_motions[i].file, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });

    return new Promise((resolve, reject) =>{
        loader.load((loader, resources) => {
            try{
                var moc = Live2DCubismCore.Moc.fromArrayBuffer(resources['moc'].data);
                var model = new LIVE2DCUBISMPIXI.ModelBuilder()
                    .setMoc(moc)
                    .setTimeScale(1)
                    .addTexture(0, resources['texture'].texture)
                    .addAnimatorLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1)
                    .build();

                var app = new PIXI.Application({ transparent: true, /* backgroundColor: 0x1099bb */ });
                $(target).append(app.view);
                app.stage.addChild(model);
                app.stage.addChild(model.masks);

                var motion_name = first_motion ? first_motion : contents.idle_motions[Math.floor(Math.random() * contents.idle_motions.length)].name;
                live2d_motion = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(resources[motion_name].data);
                model.animator.getLayer("base").play(live2d_motion);

                app.ticker.add(function (deltaTime) {
                    if(live2d_motion_onetime){
                        var motion = model.animator.getLayer("base");
                        if( motion.currentTime >= motion.currentAnimation.duration){
                            motion.stop();
                            live2d_motion_onetime = false;
                            if( live2d_motion )
                                motion.play(live2d_motion);
                        }
                    }
                    model.update(deltaTime);
                    model.masks.update(app.renderer);
                });

                var onResize = (event) => {
                    if (event === void 0)
                        event = null;
        
                    var width = $(target).width();
                    console.log(model);
                    var rasio = model.canvasinfo.CanvasWidth / model.canvasinfo.CanvasHeight;
                    var height = width / rasio;
                    app.renderer.resize(width, height);
                    model.position = new PIXI.Point((width * 0.5), (height * 0.5));
                    model.scale = new PIXI.Point(width * 1.0, width * 1.0);
                    model.masks.resize(app.view.width, app.view.height);
                };
                onResize();
                window.onresize = onResize;

                live2d_model = model;
                live2d_loader = loader;

                return resolve();
            }catch(error){
                return reject(error);
            }
        });
    });
}