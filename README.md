# Image Search Abstraction Layer

User Stories :

* I can get the image URLs, alt text and page urls for a set of images relating to a given search string

    ```
    /api/imagesearch/lolcats%20funny
    ````
    ``` json
    [{
            "url": "https://i.imgur.com/qu6Qhh6g.jpg",
            "snippet": "Could these cat assembly instructions be any more confusing ...",
            "thumbnail": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ93C--aIWfWTzemVB4CTik8s9UE451qh9ksvfXOyBeMq--W72AywJNNA&s",
            "context": "https://imgur.com/gallery/could-these-cat-assembly-instructions-be-any-more-confusing-3Mjl31l"
        },
        {
            "url": "https://i.imgur.com/3HiHnWs.jpeg",
            "snippet": "The LOLcats are here again. - lolcats post - Imgur",
            "thumbnail": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBzVLe3xmto3DyUENL10jpsTGRcep6-Rr-zjSFd7ucbX07kORvTvFCJQ&s",
            "context": "https://imgur.com/gallery/lolcats-are-here-again-emyWO"
        },
        {
            "url": "https://i.imgur.com/N1cwrGh.jpeg",
            "snippet": "lolcats Circa 2006 Dump part 5 - outdatedmeme post - Imgur",
            "thumbnail": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKdsdpXgNdyGMQg0xEfF5zT4ygNQApGqLR5YHd_CcAB4j_0hvqFsPQ8xc&s",
            "context": "https://imgur.com/gallery/lolcats-circa-2006-dump-part-5-7Vc4Okl"
        }
    ]
    ```

* I can paginate through the responses by adding a ?offset=2 parameter to the URL.

    ```
    /api/imagesearch/lolcats%20funny?offset=10 
    ```

* I can get a list of the most recently submitted search strings

    ```
    /api/latest/imagesearch/
    ```
    ``` json
    [{
            "_id": "666725bfb6b5d5c537f5cb45",
            "term": "lolcats funny",
            "when": "2024-06-10T16:11:43.858Z"
        },
        {
            "_id": "666725b9b6b5d5c537f5cb44",
            "term": "lolcats funny",
            "when": "2024-06-10T16:11:37.718Z"
        }
    ]
    ```

## Install

* Create a database on [Mongo Atlas](https://cloud.mongodb.com/).  

    ```
    Database access:
    readWrite@imagesearch.latestsearch

    Network access:
    0.0.0.0/0 (comment: Allow All)
    ```

    ```
    export MONGOLAB_URI="mongodb+srv://USERNAME:PASSWORD@imagesearch.hemms5g.mongodb.net/?retryWrites=true&w=majority&appName=imagesearch"
    ```

* Create a [Google API Key](https://developers.google.com/custom-search/v1/introduction#identify_your_application_to_google_with_api_key).  
  Set the CSE_API_KEY environment variable

    ```
    export CSE_API_KEY="XXxxXxXxx0xxXx_xxxXXXxxxXxxXX_xxX_xXXXx"
    ```

* Install the dependencies

    ```
    npm install
    ```

* Start

    ```
    npm start
    ```

    Go to localhost:8080

## Deploy on Netlify

``` bash
netlify init
netlify env:set MONGOLAB_URI "$MONGOLAB_URI"
netlify env:set CSE_API_KEY "$CSE_API_KEY"
netlify deploy
netlify deploy --prod
```
