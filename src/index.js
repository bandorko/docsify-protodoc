// COMMENT_REGEX :  ((?:\s*\/\*[\s\S]*\*\/\s*|\s*\/\/.*\s*)*)
function loadFile(filename){
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", filename, false);
        xhttp.send(null);
        return xhttp.response || "error";
}

function anchorizeType(type){
    return type.replace(/((?:.*)\s)*([^\s]+)$/,"$1[$2](#$2)")
}

function toMarkdownRPC(rpc){
    return "### "+rpc.name+"\n"+uncomment(rpc.comment)+"\n argType:"+anchorizeType(rpc.arg)+"\n retType:"+anchorizeType(rpc.ret)+"\n\n";
}

function uncomment(comment){
    return comment.replace(/(\/\/|\/\*|\*\/)/g,"")
}

function protodoc(filename){
    content = loadFile(filename)
    var rpcArr = []
    var ret = ""
    content = content.replace(/((?:\s*\/\*.*\*\/\s*|\s*\/\/.*\s*)*)rpc\s([^(]*)\(([^)]*)\)[^(]*\(([^)]*)\)[^}]*}/g,function(a,comment,rpcName,arg,ret){rpcArr[rpcName] = {name:rpcName, arg:arg, ret:ret, comment:comment};return "$"+rpcName+""})
    ret += "# Services\n"
    content = content.replace(/((?:\s*\/\*[\s\S]*\*\/\s*|\s*\/\/.*\s*)*)service\s([^{]*){([^}]*)}/g,function(all,comment,serviceName,content){ret += "## "+serviceName+"\n"+uncomment(comment)+content.replace(/\$(.[^\$^\s]*)/g,function(all,rpcName){return toMarkdownRPC(rpcArr[rpcName])});return ""})
    ret += "# Messages\n"
    content = content.replace(/((?:\s*\/\*[\s\S]*\*\/\s*|\s*\/\/.*\s*)*)message\s([^{]*){([^}]*)}/g,function(all,comment,messageName,content){ret += "## "+messageName+"\n"+uncomment(comment)+"```protobuf\n"+all+"\n```\n"; return ""})
    return ret
}

function install(hook,vm){
     hook.beforeEach(function(markdown, next) {
         ret = markdown.replace(/\[[^\]]*\]\(([^']*)':protodoc'\)/g, function(a, filename){return protodoc(filename)})
        next(ret)
    })
}

if (!window.$docsify) {
    window.$docsify = {}
  }
  
window.$docsify.plugins = (window.$docsify.plugins || []).concat(install)