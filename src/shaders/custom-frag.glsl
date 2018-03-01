#version 300 es


precision highp float;

uniform vec4 u_Color; 
uniform vec2 u_Dimension;

in float time;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

out vec4 out_Col;



void main()
{
    vec2 coord = gl_FragCoord.xy;


    out_Col = vec4(0.8, 0.5, 0, pow(coord.y / u_Dimension.y, 2.0f) * 0.8f);

}
