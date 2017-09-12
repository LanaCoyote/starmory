const mutators = {
    capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),
    humanize: (prop, value) => {
        if (prop === 'bulk' && value === 0) return 'L';
        else if (value === null || value < 0) return '-';
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

Vue.component('item-description', {
    props: ['item'],
    data: function() {
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
                const qualityType = quality.split(' ')[0].trim();
                if (specialDescriptions[ qualityType ]) {
                    descriptors.push({
                        header: mutators.capitalize(quality),
                        text: specialDescriptions[ qualityType ]
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

const App = new Vue({
    el: "#app-body",
    data: {
        armory: new ArmoryService(),
        loading: true,
        showHeader: true,
        search: '',
        filter: { order: ['asc'] },
        filterOpen: false,
        mutate: mutators,
        expanded: {}
    },

    methods: {
        updateSort: function( key ) {
            if (this.filter.sort && this.filter.sort[0] === key && this.filter.order[0] === 'asc') {
                this.filter.order = ['desc'];
            } else {
                this.filter.sort = [key];
                this.filter.order = ['asc'];
            }

            console.dir(this.filter);
            this.$forceUpdate();
        },

        updateFilter: function( newFilter ) {
            for (const key in newFilter) {
                this.filter[key] = newFilter[key];
            }

            this.$forceUpdate();
        },

        expandItem: function( item ) {
            this.expanded[ item.name ] = !this.expanded[ item.name ];
            this.$forceUpdate();
        },

        isExpanded: function( item ) {
            return this.expanded[ item.name ];
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


