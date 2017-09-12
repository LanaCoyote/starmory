const mutators = {
    capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),
    humanize: (prop, value) => {
        if (prop === 'bulk' && value === 0) return 'L';
        else if (value === null || value < 0) return '-';
        return value && mutators.capitalize( value.toString() );
    }
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
        if (subcategory) return ['name'].concat( Object.keys( subcategory[ Object.keys( subcategory )[0] ] ) );
        return [];
    }

    getItems ( filter ) {
        const category = this.data && this.data.categories && this.data.categories[ filter.category ];
        const subcategory = category && category[ filter.subcategory ];

        return _(subcategory).map((item, name) => {
            return _.extend({name}, item);
        }).orderBy( ( filter.sort || this.defaultSort ).concat( this.extendedSort ), filter.order ).value() || [];
    }
}

const App = new Vue({
    el: "#app-body",
    data: {
        armory: new ArmoryService(),
        loading: false,
        showHeader: true,
        filter: { order: ['asc'] },
        mutate: mutators
    },

    methods: {
        updateFilter: function( newFilter ) {
            for (const key in newFilter) {
                this.filter[key] = newFilter[key];
            }

            this.$forceUpdate();
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
            ArmoryLoaderService.loading = true;
            App.loading = true;

            $.getJSON( "data/armory.json", function ( data ) {
                App.armory = new ArmoryService(data);
                App.loading = false;
                ArmoryLoaderService.loading = false;
            });
        }
    },

    mounted: function() {
        this.$nextTick(function() {
            this.startLoad();
        });
    }
});

