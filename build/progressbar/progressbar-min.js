(function(){var C=YAHOO.util.Dom,D=YAHOO.lang,A="ltr",E="rtl",G="ttb",F="btt";var B=function(H){B.superclass.constructor.call(this,document.createElement("div"),H);this._init(H);};YAHOO.widget.ProgressBar=B;B.CLASS_PROGBAR="yui-pb";B.CLASS_MASK=B.CLASS_PROGBAR+"-mask";B.CLASS_BAR=B.CLASS_PROGBAR+"-bar";B.CLASS_CAPTION=B.CLASS_PROGBAR+"-caption";B.CLASS_ANIM=B.CLASS_PROGBAR+"-anim";B.CLASS_TL=B.CLASS_PROGBAR+"-tl";B.CLASS_TR=B.CLASS_PROGBAR+"-tr";B.CLASS_BL=B.CLASS_PROGBAR+"-bl";B.CLASS_BR=B.CLASS_PROGBAR+"-br";B.MARKUP=['<div class="',B.CLASS_BAR,'"></div><div class="',B.CLASS_CAPTION,'"></div><div class="',B.CLASS_MASK,'"><div class="',B.CLASS_TL,'"></div><div class="',B.CLASS_TR,'"></div><div class="',B.CLASS_BL,'"></div><div class="',B.CLASS_BR,'"></div></div>'].join("");D.extend(B,YAHOO.util.Element,{_init:function(H){},initAttributes:function(L){B.superclass.initAttributes.call(this,L);this.set("innerHTML",B.MARKUP);this.addClass(B.CLASS_PROGBAR);var J,H=["id","width","height","class","style"];while((J=H.pop())){if(J in L){this.set(J,L[J]);}}var I=this.getElementsByClassName(B.CLASS_BAR)[0],K=this.getElementsByClassName(B.CLASS_MASK)[0];this.setAttributeConfig("barEl",{readOnly:true,value:I});this.setAttributeConfig("maskEl",{readOnly:true,value:K});this.setAttributeConfig("captionEl",{value:this.getElementsByClassName(B.CLASS_CAPTION)[0],validator:function(M){return(D.isString(M)&&C.get(M))||(D.isObject(M)&&M.ownerDocument==document);},setter:function(M){return C.get(M);}});this.setAttributeConfig("direction",{value:A,validator:function(M){if(this._rendered){return false;}switch(M){case A:case E:case G:case F:return true;default:return false;}},method:function(M){this._barSizeFunction=this._barSizeFunctions[this.get("anim")?1:0][M];}});this.setAttributeConfig("maxValue",{value:100,validator:D.isNumber,method:function(M){this.get("element").setAttribute("aria-valuemax",M);if(this.get("value")>M){this.set("value",M);}}});this.setAttributeConfig("minValue",{value:0,validator:D.isNumber,method:function(M){this.get("element").setAttribute("aria-valuemin",M);if(this.get("value")<M){this.set("value",M);}}});this.setAttributeConfig("width",{getter:function(){return this.getStyle("width");},method:this._widthChange});this.setAttributeConfig("height",{getter:function(){return this.getStyle("height");},method:this._heightChange});this.setAttributeConfig("textTemplate",{value:"{value}"});this.setAttributeConfig("value",{value:0,validator:function(M){return D.isNumber(M)&&M>=this.get("minValue")&&M<=this.get("maxValue");},method:this._valueChange});this.setAttributeConfig("anim",{validator:function(M){return !!YAHOO.util.Anim;},setter:this._animSetter});},render:function(I,J){if(this._rendered){return;}this._rendered=true;var K=this.get("direction");this.addClass(B.CLASS_PROGBAR);this.addClass(B.CLASS_PROGBAR+"-"+K);var H=this.get("element");H.tabIndex=0;H.setAttribute("role","progressbar");H.setAttribute("aria-valuemin",this.get("minValue"));H.setAttribute("aria-valuemax",this.get("maxValue"));this.appendTo(I,J);switch(K){case F:C.setStyle(this.get("barEl"),"background-position","left bottom");break;case E:C.setStyle(this.get("barEl"),"background-position","right");break;}this._barSizeFunction=this._barSizeFunctions[0][K];this.redraw();this._fixEdges();if(this.get("anim")){this._barSizeFunction=this._barSizeFunctions[1][K];}this.on("minValueChange",this.redraw);this.on("maxValueChange",this.redraw);return this;},redraw:function(){this._recalculateConstants();this._valueChange(this.get("value"));},destroy:function(){this.set("anim",false);this.unsubscribeAll();this.get("captionEl").innerHTML="";var H=this.get("element");H.parentNode.removeChild(H);},_previousValue:0,_barSpace:100,_barFactor:1,_rendered:false,_barSizeFunctions:[{ltr:function(K,H,I,J){C.setStyle(I,"width",H+"px");this.fireEvent("progress",K);this.fireEvent("complete",K);},rtl:function(K,H,I,J){C.setStyle(I,"width",H+"px");C.setStyle(I,"left",(this._barSpace-H)+"px");this.fireEvent("progress",K);this.fireEvent("complete",K);},ttb:function(K,H,I,J){C.setStyle(I,"height",H+"px");this.fireEvent("progress",K);this.fireEvent("complete",K);},btt:function(K,H,I,J){C.setStyle(I,"height",H+"px");C.setStyle(I,"top",(this._barSpace-H)+"px");this.fireEvent("progress",K);this.fireEvent("complete",K);}},{ltr:function(K,H,I,J){if(J.isAnimated()){J.stop();}C.addClass(I,B.CLASS_ANIM);this._tweenFactor=(K-this._previousValue)/J.totalFrames;J.attributes={width:{to:H}};J.animate();},rtl:function(K,H,I,J){if(J.isAnimated()){J.stop();}C.addClass(I,B.CLASS_ANIM);this._tweenFactor=(K-this._previousValue)/J.totalFrames;J.attributes={width:{to:H},left:{to:this._barSpace-H}};J.animate();},ttb:function(K,H,I,J){if(J.isAnimated()){J.stop();}C.addClass(I,B.CLASS_ANIM);this._tweenFactor=(K-this._previousValue)/J.totalFrames;J.attributes={height:{to:H}};J.animate();},btt:function(K,H,I,J){if(J.isAnimated()){J.stop();}C.addClass(I,B.CLASS_ANIM);this._tweenFactor=(K-this._previousValue)/J.totalFrames;J.attributes={height:{to:H},top:{to:this._barSpace-H}};J.animate();}}],_barSizeFunction:null,_heightChange:function(H){if(D.isNumber(H)){H+="px";}this.setStyle("height",H);this._fixEdges();this.redraw();},_widthChange:function(H){if(D.isNumber(H)){H+="px";}this.setStyle("width",H);this._fixEdges();this.redraw();},_fixEdges:function(){if(!this._rendered||YAHOO.env.ua.ie||YAHOO.env.ua.gecko){return;}var K=this.get("maskEl"),M=C.getElementsByClassName(B.CLASS_TL,undefined,K)[0],J=C.getElementsByClassName(B.CLASS_TR,undefined,K)[0],L=C.getElementsByClassName(B.CLASS_BL,undefined,K)[0],I=C.getElementsByClassName(B.CLASS_BR,undefined,K)[0],H=(parseInt(C.getStyle(K,"height"),10)-parseInt(C.getStyle(M,"height"),10))+"px";C.setStyle(L,"height",H);C.setStyle(I,"height",H);H=(parseInt(C.getStyle(K,"width"),10)-parseInt(C.getStyle(M,"width"),10))+"px";C.setStyle(J,"width",H);C.setStyle(I,"width",H);},_recalculateConstants:function(){var H=this.get("barEl");this._mn=this.get("minValue")||0;
switch(this.get("direction")){case A:case E:this._barSpace=parseInt(this.get("width"),10)-(parseInt(C.getStyle(H,"marginLeft"),10)||0)-(parseInt(C.getStyle(H,"marginRight"),10)||0);break;case G:case F:this._barSpace=parseInt(this.get("height"),10)-(parseInt(C.getStyle(H,"marginTop"),10)||0)-(parseInt(C.getStyle(H,"marginBottom"),10)||0);break;}this._barFactor=this._barSpace/(this.get("maxValue")-this._mn)||1;},_animSetter:function(J){var I,H=this.get("barEl");if(J){if(J instanceof YAHOO.util.Anim){I=J;}else{I=new YAHOO.util.Anim(H);}I.onTween.subscribe(this._animOnTween,this,true);I.onComplete.subscribe(this._animComplete,this,true);}else{I=this.get("anim");if(I){I.onTween.unsubscribeAll();I.onComplete.unsubscribeAll();}I=null;}this._barSizeFunction=this._barSizeFunctions[I?1:0][this.get("direction")];return I;},_animComplete:function(H){var I=this.get("value");this._previousValue=I;this.fireEvent("complete",I);C.removeClass(this.get("barEl"),B.CLASS_ANIM);this._showTemplates(I,true);},_animOnTween:function(H){var I=Math.floor(this._tweenFactor*this.get("anim").currentFrame+this._previousValue);this.fireEvent("progress",I);this._showTemplates(I,false);},_valueChange:function(K){var J=this.get("anim"),H=Math.floor((K-this._mn)*this._barFactor),I=this.get("barEl");this._showTemplates(K,true);if(this._rendered){this.fireEvent("start",this._previousValue);this._barSizeFunction(K,H,I,J);}},_showTemplates:function(K,I){var J=this.get("captionEl"),H=this.get("element"),L=D.substitute(this.get("textTemplate"),{value:K,minValue:this.get("minValue"),maxValue:this.get("maxValue")});if(J){J.innerHTML=L;}if(I){H.setAttribute("aria-valuenow",K);H.setAttribute("aria-valuetext",J.textContent);}}});})();YAHOO.register("progressbar",YAHOO.widget.ProgressBar,{version:"@VERSION@",build:"@BUILD@"});