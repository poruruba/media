'use strict';

const vConsole = new VConsole();
//window.datgui = new dat.GUI();

const UPDATE_INTERVAL = 10000;
var updated = false;

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    data: {
    },
    computed: {
    },
    methods: {
    },
    created: function(){
    },
    mounted: function(){
        proc_load();

        const callbacks = {
            onUpdate: (data) => {
                console.log(data);
                if( !updated ){
                    setInterval(() => {
                        if (this.webrtc_opened)
                            window.interactiveCanvas.sendTextQuery("継続して");
                    }, UPDATE_INTERVAL);
                    updated = true;
                }
            }
        };
        window.interactiveCanvas.ready(callbacks);
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */
  
window.vue = new Vue( vue_options );
