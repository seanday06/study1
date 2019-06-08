# Three.js를 이용한 3D Web application 개발

## WebGL과 Three.js

Web 화면은 보통 HTML과 CSS를 이용하여 구성한다. 
여기에 3D 효과를 주려면 WebGL(Web Graphics Library) 기술이 필요하다.

WebGL은 HTML5의 `canvas` 엘리먼트에서 2D, 3D 그래픽을 표현하는 기능을 제공하는 JavaScript API이다.
WebGL을 웹 브라우저의 버전에 따라서 지원여부를 확인해야 한다.
Google Chrome 9+, Internet Explorer 11+, Safari 5.1+, MS Edge build 10240+, Firefox 4+, Opera 12+ 에서 사용할 수 있다.
브라우저별 지원 기능에 대한 보다 상세한 내용은 다음을 참조하라. [CanIUse](https://caniuse.com/#feat=webgl)  
WebGL은 GPU 기능을 사용하기 때문에 하드웨어에서도 지원해야 한다.

WebGL의 API를 그대로 사용하기는 매우 어렵고 복잡하다.
Three.js가 이를 보다 사용하기 쉬운 API로 다듬어서 제공한다.

## Three.js 저장소, 포럼

Three.js는 GitHub 주소 [https://github.com/mrdoob/three.js](https://github.com/mrdoob/three.js)에서 이용할 수 있다.

공식 Three.js 포럼 주소는 다음과 같다: [https://discourse.threejs.org/](https://discourse.threejs.org/)  

Three.js는 3개의 파일로 배포된다.
저장소의 `/build` 디렉토리를 보면 이들을 볼 수 있다:

* three.js
* three.min.js
* three.module.js

공식 파일은 `three.js`이고, `three.min.js` 파일은 이를 압축한 파일이다.  
`three.module.js` 파일은 핵심부분을 JavaScript Module 형태로 만든 파일이다.  
이 파일은 일반 JavaScript에서 `import`하여 사용할 수 있다:  

```
    // app.js

    import * as THREE from 'three.module.js'
    ...
```



