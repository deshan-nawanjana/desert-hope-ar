// helper to read data from local storage
const getLocal = (key, except = null) => {
    // check local storage
    if (key in localStorage) {
        // return local data
        return JSON.parse(localStorage.getItem(key))
    } else {
        // return default data
        return except
    }
}

// helper to save data into local storage
const setLocal = (key, data) => {
    // stringify data
    const text = JSON.stringify(data)
    // save data on local
    localStorage.setItem(key, text)
}

// vue app definition
const app = new Vue({
    el: '#app',
    // data object
    data: {
        // current page
        page: 'spinner',
        // ribbon data
        ribbon: {
            // solid background
            solid: false
        },
        // app data
        data: {},
        // explore page data
        explore: {
            // product categories
            categories: [],
            // current tag groups
            tag_id: 'popular',
            // product tag groups
            tags: {
                popular: [],
                newest: [],
                trending: [],
            }
        },
        // product page data
        product: {
            // current item id
            item_id: null,
            // current type id
            type_id: null,
            // content tab id
            tab: 'details'
        },
        // reality data
        reality: {
            // current model id
            model: null
        },
        // profile data
        profile: getLocal('desert-hope-data', {
            // personal info
            info: {
                name: '',
                address: '',
                mobile: '',
                email: ''
            },
            // cart items data
            cart: [],
            // liked items
            likes: []
        })
    },
    // computed values
    computed: {
        cart_count() {
            // get total of quantity in cart
            const count = this.profile.cart.map(item => item.quantity).reduce((a, b) => a + b, 0)
            // return count
            return count > 0 ? count : false
        },
        // current product data
        product_data() {
            // return if no products
            if (!this.data.products) { return { types: [] } }
            // match product data by id
            const data = this.data.products.find(item => item.id === this.product.item_id)
            // return product data
            return data ? data : { types: [] }
        },
        // current product data
        product_type() {
            // return if no products
            if (!this.product_data) { return {} }
            // return if no product types
            if (!this.product_data.types.length) { return {} }
            // match product type data by id
            const type = this.product_data.types.find(item => item.id === this.product.type_id)
            // return type data
            return type ? type : {}
        },
        // current product liked state
        product_like() {
            // get product id
            const item_id = this.product.item_id
            // get product type id
            const type_id = this.product.type_id
            // match with liked products
            return this.profile.likes.some(item => {
                return item.item_id === item_id && item.type_id === type_id
            })
        }
    },
    // methods
    methods: {
        // method to navigate
        next(code) {
            // navigate forward
            window.location = '#' + code
        },
        // method to navigate back
        back() {
            // navigate back
            window.history.back()
        },
        // method to save profile data
        saveProfileData() {
            // save profile data
            setLocal('desert-hope-data', this.profile)
        },
        // method to update scroll states
        updateScroll(event) {
            // set ribbon solid by scroll top
            this.ribbon.solid = event.target.scrollTop > 30
        },
        navigate(page, data = 'default') {
            if (page === 'product' || page === 'reality') {
                window.location = '#' + page + ':' + data
            } else {
                window.location = '#' + page
            }
        },
        // method to open porduct page
        viewProduct(item_id, type_id) {
            // set page id
            this.page = 'product'
            // set product id
            this.product.item_id = item_id
            // check for type id
            if (type_id) {
                // set product type id
                this.product.type_id = type_id
            } else {
                // set first product type id
                this.product.type_id = this.product_data.types[0].id
            }
        },
        // method to like product
        likeProduct(item_id, type_id) {
            // check liked state
            if (this.product_like === false) {
                // push to liked items
                this.profile.likes.push({ item_id, type_id })
            } else {
                // remove item from likes
                this.profile.likes = this.profile.likes.filter(item => {
                    // match with any other liked items
                    return item.item_id !== item_id || item.type_id !== type_id
                })
            }
            // save profile data
            this.saveProfileData()
        },
        // method to add to cart
        addToCart(item_id, type_id) {
            // match for exists same product
            const item = this.profile.cart.find(item => {
                return item.item_id == item_id && item.type_id === type_id
            })
            // increase quantity if exists
            if (item) { item.quantity += 1 } else {
                // push to card array
                this.profile.cart.push({ item_id, type_id, quantity: 1 })
            }
            // save profile data
            this.saveProfileData()
        }
    },
    // on mounted
    async mounted() {
        // load app data
        this.data = await fetch('index.json').then(resp => resp.json())
        // grouping product items
        for (let i = 0; i < this.data.products.length; i++) {
            // current item
            const item = this.data.products[i]
            // find category by id
            const category = this.explore.categories.find(x => x.id === item.category.id)
            // check category
            if (category) {
                // push to category
                category.products.push(item)
            } else {
                // add new category
                this.explore.categories.push({
                    id: item.category.id,
                    name: item.category.name,
                    products: [item]
                })
            }
            // push to popular tag group
            if (item.tags.includes('popular')) { this.explore.tags.popular.push(item) }
            // push to newest tag group
            if (item.tags.includes('newest')) { this.explore.tags.newest.push(item) }
            // push to trending tag group
            if (item.tags.includes('trending')) { this.explore.tags.trending.push(item) }
        }
        // hash change listener
        window.addEventListener('hashchange', () => {
            // get hash string array
            const hash = window.location.hash.replace('#', '').split(':')
            // get page id
            const page = hash[0]
            // check page
            if (page === 'product') {
                // set product id
                this.product.item_id = hash[1]
                // set product type id
                this.product.type_id = hash[2]
                // set product page
                this.page = 'product'
                // set product details tab
                this.product.tab = 'details'
            } else if (page === 'cart') {
                // set explore page
                this.page = 'cart'
            } else if (page === 'reality') {
                // set reality page
                this.page = 'reality'
                // set reality model
                this.reality.model = 'assets/models/' + hash[1] + '.glb'
            } else {
                // set explore page
                this.page = 'explore'
            }
        })
        // load explore page
        this.next('explore')
    }
})