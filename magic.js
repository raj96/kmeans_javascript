    var externData;
    var browse_mode;
    var K;
    var lastIndex;

    function _(z) {
        return document.getElementById(z);
    }

    function loadImage() {
        var file_chooser = _('file-chooser');
        
        if(browse_mode){
            file_chooser.click();
            _('load-img').innerHTML = 'Load';
            browse_mode = false;
            return;
        }

        var file = new FileReader();

        if(!file_chooser.files[0].type.match('image*'))
            window.alert("Please select an image file");
        else {
            file.onload = ()=>{
                showImage(file.result);
            }

            file.onerror = ()=>{
                window.alert(file.error);
            }

            file.readAsDataURL(file_chooser.files[0]);
        }

        browse_mode = true;
        _('load-img').innerHTML = 'Browse';

    }

    function showImage(image) {
        var canvas = _('picture-space');
        var ctxt = canvas.getContext('2d');

        var rcanvas = _('res-canvas');
        var rctxt = rcanvas.getContext('2d');

        var img = new Image();

        img.onload = ()=>{
            canvas.width = img.width;
            canvas.height = img.height;

            rcanvas.width = img.width;
            rcanvas.height = img.height;

            ctxt.drawImage(img,0,0);

            _('kbutton').disabled = false;
        }

        img.src = image;
    }

    function showKdialog(no_of_clusters) {
        try {
           K = Number(no_of_clusters.toFixed());
           setTimeout(KMeans,0);
           // KMeans.call();
        }
        catch(e) {
            window.alert("Some error occurred.\nType of error: "+e.name);
            console.log(e);
        }   
    }

    async function KMeans() {
        var canvas = _('picture-space');
        var ctxt = canvas.getContext('2d');

        var width = canvas.width;
        var height = canvas.height;
        var pixelCount = (width-1)*(height-1);

        var resultCanvas = _('res-canvas');
        var resultCtxt = resultCanvas.getContext('2d');

        var pixelData = ctxt.getImageData(0,0,width,height);
        var pixels = pixelData.data.length;

        console.log("Width: "+width);
        console.log("Height: "+height);
        console.log("No. of pixels: "+(width*height));
        console.log("Size of pixel data: "+pixels);

        var centroids = new Array();
        var distance = new Array();
        var clusters = new Array(K);
        var previous_centroids = new Array();

        var x,y;
        var iter = 0;
        var table = "<table border=1><th>Cluster No.</th>";
        console.log("Pixel Count: "+pixelCount);
        for(i=0;i<K;i++) {
            var index = getRandomPoint(pixelCount) * 4;
            
            while(pixelData.data[index]==NaN)
                index = getRandomPoint(pixelCount) * 4;
            
            centroids.push(new Color(pixelData.data[index],pixelData.data[index+1],pixelData.data[index+2]));
            
            table += '<th>'+(i+1)+'</th>';
        }

        do{
            table += "<tr>";
            table += "<td><div><b>Iter #"+iter+"</b></div></td>"; 
            for(i=0;i<K;i++) {
                table += "<td><div style=width:3vmax;height:3vmax;background:rgb("+centroids[i].red+","+centroids[i].green+","+centroids[i].blue+")></div></td>";
            }
            table += "</tr>";

            previous_centroids = centroids;
            for(i=0;i<K;i++) {
                clusters[i] = new Array();
            }
            console.log("Inside Loop");
            for(r=0;r<height;r++) {
                for(c=0;c<width;c++) {
                    //Calculation for mapping (x,y) co-ordinate to the color matrix
                    var pointIndex = getArrayIndex(c,r,width);

                    //Getting the color at (x,y)
                    var pointColor = new Color(
                    pixelData.data[pointIndex],
                    pixelData.data[pointIndex+1],
                    pixelData.data[pointIndex+2]);
                    
                    for(n=0;n<K;n++) {

                        var centroidColor = centroids[n];

                        lastIndex = {"h":r,"w":c,"li":pointIndex};

                        //Calculating the weight between the centroid and the point
                        distance.push(calculateDistance(pointColor,centroidColor));
                    }

                    //Storing the point (x,y) in the appropriate cluster
                    clusters[indexOfMinCentroid(distance)].push(new Point(c,r));

                    //Clearing the distance array
                    distance = new Array();
                }
            }

            //Empty the current centroid list
            centroids = new Array();

            //Calculation of new centroids
            for(n=0;n<K;n++) {
                avgRed = 0;
                avgGreen = 0;
                avgBlue = 0;
                for(i=0;i<clusters[n].length;i++) {
                    index = getArrayIndex(clusters[n][i].x,clusters[n][i].y,width);
                    avgRed += pixelData.data[index];
                    avgGreen += pixelData.data[index+1];
                    avgBlue += pixelData.data[index+2];
                }
                
                avgRed /= clusters[n].length;
                avgGreen /= clusters[n].length;
                avgBlue /= clusters[n].length;

                avgRed = avgRed.toFixed();
                avgGreen = avgGreen.toFixed();
                avgBlue = avgBlue.toFixed();

                centroids.push(new Color(avgRed,avgGreen,avgBlue));
            }
            console.log("New Centroid: "+JSON.stringify(centroids));
            iter++;
        }while(notEqual(previous_centroids,centroids));

        table += '<tr>';
        table += '<td>Pixel Count</td>';
        for(i=0;i<K;i++)
            table += '<td>'+clusters[i].length+'</td>';
        table += '</td>';
        table += '</tr>';

        table += '</table>';
        _('cluster-visualize').innerHTML = table;

        console.log('No more centroid calculation');

        for(i=0;i<K;i++) {
            for(j=0;j<clusters[i].length;j++) {
                index = getArrayIndex(clusters[i][j].x,clusters[i][j].y,width);
                pixelData.data[index] = centroids[i].red;
                pixelData.data[index+1] = centroids[i].green;
                pixelData.data[index+2] = centroids[i].blue;
            }
        }

        for(i=0;i<K;i++) {
            console.log(clusters[i].length+" pixels in Cluster #"+(i+1));
        }

        resultCtxt.putImageData(pixelData,0,0);
    }

    function indexOfMinCentroid(distance) {
        if(distance.length<0)
            return 0;
        var min = distance[0];

        for(i=1;i<distance.length;i++) {
            min = (min>distance[i])?distance[i]:min;
        }
        
        if(distance.indexOf(min)<0 || distance.indexOf(min) > distance.length-1)
            throw distance;

        return distance.indexOf(min);
    }

    function calculateDistance(color1,color2) {
        var rsqr = Math.pow((color1.red-color2.red),2);
        var gsqr = Math.pow((color1.green-color2.green),2);
        var bsqr = Math.pow((color1.blue-color2.blue),2);
    
        return Number(Math.sqrt(rsqr + gsqr + bsqr).toFixed(5));
    }

    function getIndex(cr,cc,tc) {
        return Number( cc + ( tc + 1 ) * cr );
    }

    function getArrayIndex(x,y,width) {
        return Number( 4 * ( x + y*width ) );
    }

    function Color(red,green,blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    function notEqual(arr1,arr2) {
        if(arr1.length!=arr2.length)
            return true;
        else {
            for(i=0;i<arr1.length;i++) {
                if(calculateDistance(arr1[i],arr2[i])>5)
                    return true;
            }
            return false;
        }
    }

    function getRandomPoint(dimension) {
        return Number( ( ( Math.random() * 5323171107 ) % dimension ).toFixed(0) );
    }

    function Point(x,y) {
        this.x = x;
        this.y = y;
    }

    window.onload = () => {
        browse_mode = true;
        _('load-img').innerHTML = 'Browse';
        _('load-img').onclick = loadImage;
        _('kbutton').disabled = true;
        _('kbutton').onclick = ()=>{
            showKdialog(Number(prompt("Enter value for K (Number of clusters to be formed): ")));
        }
        console.log("Loaded");
    };
