import { Image } from './models/image';
import { getImagesArr } from './page_operations';
import { getMetadata } from './get_metadata';

export async function saveImages() {
    let imagesPathsArr = await getImagesArr();
    console.log('images arr: ' + imagesPathsArr);

    for(let i = 0; i < imagesPathsArr.length; i++) {
        console.log(i);
        
        let imageIsExist = await Image.exists({id: i});

        if(!imageIsExist) {
            try{
                console.log('image is exist: ' +imageIsExist);
                let imagePath = imagesPathsArr[i];
                let metadata = await getMetadata(imagePath);
                let image = await Image.create({id: i, path: imagePath, metadata: metadata})
                console.log('image obj: ' + image)
            } catch(err) {
                let error = err as Error;
                console.log(error.message)
            }
        }
    }
}