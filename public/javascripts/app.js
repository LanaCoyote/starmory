const mutators = {
    capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),
    humanize: (prop, value) => {
        switch ( prop ) {
            case 'armor check penalty' :
            case 'speed adjustment' :
                if (value < 0) return value;
                else if (value === 0) return '-';
                break;
            case 'bulk' :
                if (value === 0) return 'L';
            default :
                if (value === null || value < 0) return '-';
        }

        return value && mutators.capitalize( value.toString() );
    }
};

const criticalDescriptions = {
    'burn' : "The target gains the burning condition",
    'staggered' : "The target gains the staggered condition"
};

const specialDescriptions = {
    'analog' : "This item requires neither technology nor magic to function"
};

function getFirstItem(categoryOrSub, isSubCategory) {
    if (!categoryOrSub) return;
    if (!isSubCategory) categoryOrSub = categoryOrSub[ Object.keys(categoryOrSub)[0] ];
    return categoryOrSub[ Object.keys(categoryOrSub)[0] ];
}

function snapHeight() {
    const header = $('header');
    $('.content').offset({ top: header.height() });
    snapColumns();
}

function snapColumns() {
    const widths = $('.template-header').children('th').map( (_,column) => $( column ).width() ).get();
    $('.fixed-header').children('th').each(( index, column ) => {
        $( column ).width( widths[ index ] );
    });
}

class ArmoryService {
    constructor (data) {
        this.data = data;
        this.defaultSort = ['hands'];
        this.extendedSort = ['type', 'level', 'name']
    }

    getCategories () {
        if (this.data && this.data.categories) return Object.keys(this.data.categories);
        return [];
    }

    getSubcategories ( filter ) {
        const category = this.data && this.data.categories && this.data.categories[ filter.category ];
        if (category) return Object.keys(category);
        return [];
    }

    getProperties ( filter ) {
        const category = this.data && this.data.categories && this.data.categories[ filter.category ];
        const subcategory = category && category[ filter.subcategory ];
        const firstItem = getFirstItem(subcategory || category, !!subcategory);
        if (firstItem) return ['name'].concat( Object.keys( firstItem ) );
        return [];
    }

    getItems ( filter ) {
        const category = this.data && this.data.categories && this.data.categories[ filter.category ];
        let subcategory = category && category[ filter.subcategory ];
        const nameFilter = filter.name && new RegExp( filter.name, 'i' );

        if (category && !subcategory) {
            subcategory = _.reduce(category, (master, sub) => _.merge(master, sub), {});
        }

        return _(subcategory).map((item, name) => {
                return _.extend({name}, item);
            })
            .filter(item => {
                if (!nameFilter) return true;
                return nameFilter.test( item.name );
            })
            .orderBy( ( filter.sort || this.defaultSort ).concat( this.extendedSort ), filter.order )
            .value() || [];
    }
}


const App = new Vue({
    el: "#app-body",
    data: {
        armory: new ArmoryService(),
        descriptions: {},
        loading: true,
        showHeader: true,
        search: '',
        filter: { order: ['asc'] },
        filterOpen: false,
        mutate: mutators,
        expanded: {},
        dropdown: ''
    },

    methods: {
        updateSort: function( key ) {
            if (this.filter.sort && this.filter.sort[0] === key && this.filter.order[0] === 'asc') {
                this.filter.order = ['desc'];
            } else {
                this.filter.sort = [key];
                this.filter.order = ['asc'];
            }

            this.$forceUpdate();
            Vue.nextTick(snapColumns);
        },

        setCategory: function( category ) {
            this.filter = { category: category };
            Vue.nextTick(snapHeight);
        },

        updateFilter: function( newFilter ) {
            for (const key in newFilter) {
                this.filter[key] = newFilter[key];
            }

            this.$forceUpdate();
            Vue.nextTick(snapColumns);
        },

        expandItem: function( item ) {
            this.expanded[ item.name ] = !this.expanded[ item.name ];
            this.$forceUpdate();
        },

        isExpanded: function( item ) {
            return this.expanded[ item.name ];
        },


        getItemClass: function( item ) {
            return item && item.type && item.type.split(',')[0];
        }

    }
});

const ArmoryLoaderService = new Vue({
    el: "#loader",
    data: {
        loading: false
    },

    methods: {
        startLoad: function() {
            let thingsToLoad = 2;
            ArmoryLoaderService.loading = true;
            App.loading = true;

            function done() {
                App.loading = false;
                ArmoryLoaderService.loading = false;
            }

            $.getJSON( "data/armory.json", function ( data ) {
                App.armory = new ArmoryService(data);
                if (!--thingsToLoad) done();
            });

            $.getJSON( "data/descriptors.json", function ( data ) {
                App.descriptors = data;
                if (!--thingsToLoad) done();
            });
        }
    },

    mounted: function() {
        this.$nextTick(function() {
            this.startLoad();
        });
    }
});


Vue.component('nav-dropdown', {
    props: ['category', 'subcategories'],
    data: function() {
        return { mutate: mutators, setCategory: App.setCategory };
    },
    template:       "<li class=\"dropdown\">\n" +
    "                  <a href=\"#\" v-on:click=\"setCategory(category)\">" +
    "                       {{ mutate.capitalize( category ) }}" +
    "                  </a>\n" +
    "                  <i class=\"fa fa-caret-down\" v-if='subcategories'></i>\n" +
    "                  <ul class=\"menu vertical\" v-if='subcategories'>\n" +
    "                    <li><a v-on:click=\"setCategory(category)\">All {{ category }}</a></li>" +
    "                    <li v-for=\"subcategory in subcategories.split(',')\">" +
    "                       <a v-on:click=\"setCategory(subcategory)\">{{ mutate.capitalize( subcategory ) }}</a>" +
    "                    </li>\n" +
    "                  </ul>\n" +
    "                </li>"
});

Vue.component('item-description', {
    props: ['item'],
    data: function() {
        const descriptorConstants = App.descriptors;
        if (!descriptorConstants) return {};
        let descriptors = [];

        if (this.item.damage === 'by grenade') {
            descriptors.push({
                header: "By grenade",
                text: "This weapon fires grenades instead of ammunition"
            })
        }

        const criticalType = this.item.critical && this.item.critical.split(' ')[0];
        if (criticalDescriptions[ criticalType ]) {
            descriptors.push({
                header: mutators.capitalize( this.item.critical ),
                text: criticalDescriptions[ criticalType ]
            });
        }

        if (this.item.special) {
            const specials = this.item.special.split(',');
            specials.forEach(quality => {
                const qualityType = quality.trim().split(' ')[0];
                if (descriptorConstants.special[ qualityType ]) {
                    descriptors.push({
                        header: mutators.capitalize( quality.trim() ),
                        text: descriptorConstants.special[ qualityType ]
                    });
                }
            })
        }

        return { descriptors: descriptors }
    },
    template: "<td colspan='100'>" +
    "<p>{{ item._description || 'No description available' }}</p>" +
    "<ul>" +
    "<li v-for='descriptor in descriptors'>" +
    "<strong>{{ descriptor.header }}</strong> - {{ descriptor.text }}" +
    "</li>" +
    "</ul>" +
    "</td>"
});
