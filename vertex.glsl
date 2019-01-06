attribute vec4 position;
attribute vec4 color;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying lowp vec4 vColor;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * position;
  vColor = color;
}