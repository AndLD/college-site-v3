import { Router } from 'express'
import { controller } from '../../controllers/controller'
import { publicArticlesControllers } from '../../controllers/public/articles'

export default Router()
    // TODO: Merge with equivalent endpoint in private router
    // Download articles
    .get('/download', publicArticlesControllers.getDownloadArticles)

    // Article getting by id
    .get('/:id', controller)
