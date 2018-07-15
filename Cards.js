
var cards;

function addEntry(URL, hash){

  console.log(document.getElementById('name').value + ":" + document.getElementById('info').value + ":" + parseInt(document.getElementById('age').value)+":" + URL +":" +hash);
  cards.addCard(document.getElementById('name').value,
              parseInt(document.getElementById('age').value),
              document.getElementById('info').value, 
               URL, hash, (err,res)=>{ console.log(err); console.log(res);});

}

function showEntry(numEntry, numPlace){

    cards.getCard(numEntry, (err,res)=>{ 

        data = res;
        document.getElementById('name'+numPlace+'fromBlockchain').innerHTML = data[0].replace("<", "&lt;").replace(">", "&gt;");
        document.getElementById('age'+numPlace+'fromBlockchain').innerHTML = 'Age: ' + data[1];
        document.getElementById('info'+numPlace+'fromBlockchain').innerHTML = data[2].replace("<", "&lt;").replace(">", "&gt;");
        downloadUserImage(data[3].split('/')[data[3].split('/').length-1], data[4], 'pic' + numPlace + 'fromBlockchain');

    });
    
}

function updateShowingEntrys(){

  cards.getSize((err,res)=>{

      var len = res.c[0];
      console.log(len);

      var nm = len > 3 ? 3 : len;
      for (var i = 0; i < nm; i++) {

          console.log((len - nm + i));
          showEntry(len - nm + i, i);
          
      }

  });

}

function initEth(){

  web3.eth.getAccounts((error,accounts)=>{
  if (error) {console.log(error); return; }

  web3.eth.defaultAccount = accounts[0];

  var address = "0xe4518cf1a329e2942fab66c764307c97c52380ea";

  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
  } else {}


  var EthContract = web3.eth.contract([  
            {
            'constant': false,
            'inputs':[{'name': 'name', 'type': 'string'},
                      {'name': 'age', 'type': 'uint8'},
                      {'name': 'info', 'type': 'string'},
                      {'name': 'imageUrl', 'type': 'string'},
                      {'name': 'imageHash', 'type': 'string'}],
            'name': 'addCard',
            'outputs': [],
            'type': 'function'
            },
            {
              'constant': true,
              'inputs':[{'name':'num', 'type':'uint8'}], 
              'name': 'getCard', 
              'outputs': [{'name': 'name', 'type': 'string'},
                          {'name': 'age', 'type': 'uint8'},
                          {'name': 'info', 'type': 'string'},
                          {'name': 'imageUrl', 'type': 'string'},
                          {'name': 'imageHash', 'type': 'string'}],
              'type':'function'
            },
            {
              'constant': true,
              'inputs':[], 
              'name': 'getSize', 
              'outputs': [{'name': 'size', 'type': 'uint256'}],
              'type':'function'
            }]);

  cards = EthContract.at(address);

  console.log("Contract initialized successfully");

  //-------

  updateShowingEntrys();

  });
}



function setUserImage(b64, nameImgPlace){
  var i = new Image();

  i.onload = function(){
    console.log(i.width + ", " + i.height);

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");

	var img;
    if (i.width > i.height) {
      ctx.filter = 'blur(50px)';
      ctx.drawImage(i,0,0,740,560);
      ctx.filter = 'none';
      var newHeight = (740/i.width)*i.height;
      ctx.drawImage(i,0,(560-newHeight)/2,740,newHeight);

      img = canvas.toDataURL("image/jpg");
    } else {
      ctx.filter = 'blur(50px)';
      ctx.drawImage(i,0,0,740,560);
      ctx.filter = 'none';
      var newWidth = (560/i.height)*i.width;
      ctx.drawImage(i,(740-newWidth)/2,0,newWidth,560);

      img = canvas.toDataURL("image/jpg");
    }
	
	document.getElementById(nameImgPlace).src = img;
    ctx.clearRect(0, 0, 740, 560);  //clear canvas

  };

  i.src = "data:image/jpg;base64," + b64;
}
function downloadUserImage(name, hash, nameImgPlace){

  if (name == "null") {document.getElementById(nameImgPlace).src = "/img/nullImage.jpg"; return; }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/userImg/' + name, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e){

    var byteArray = new Uint8Array(this.response);

    var b64 = base64js.fromByteArray(byteArray);
    var bitArray = sjcl.hash.sha256.hash(b64);
    var textHash = sjcl.codec.hex.fromBits(bitArray);
    console.log(textHash);
    
    if (textHash == hash) setUserImage(b64, nameImgPlace);
    else document.getElementById(nameImgPlace).src = "/img/isBrokenHash.jpg";
  };

  xhr.onerror = function(e){
    document.getElementById(nameImgPlace).src = "/img/isBrokenLink.jpg";
  }

  xhr.send();

}


function getHash(file, name){
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(){
    var bitArray = sjcl.hash.sha256.hash(reader.result.slice(23)); // slice crop 'data:image/jpeg;base64,'
    var textHash = sjcl.codec.hex.fromBits(bitArray);
    
    addEntry("http://block-of-fame.xyz/userImg/"+name, textHash)
  }

}

function uploadUserImage(){
  
  console.log('uploadUserImage...');

  var file_data = document.getElementById('userFile').files[0];
  if (file_data == undefined) { 
    addEntry("null", "null"); 
    return ;
  }


  var formData = new FormData();

  var bitArray = sjcl.hash.sha256.hash(Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15));
  var nameFile = sjcl.codec.hex.fromBits(bitArray);
  nameFile += '.' + file_data.type.split('/')[1];

  getHash(file_data, nameFile);

  formData.append('userFile', file_data, nameFile);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/uploadImage.php', true);
  xhr.onload = function(e){ console.log(e); };

  xhr.send(formData);
}

