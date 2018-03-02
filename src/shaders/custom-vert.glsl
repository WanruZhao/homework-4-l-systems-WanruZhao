#version 300 es

uniform mat4 u_Model;       

uniform mat4 u_ModelInvTr;  

uniform mat4 u_ViewProj;    

uniform vec4 u_Color;

uniform int u_Time;

in vec4 vs_Pos;             

in vec4 vs_Nor;             

in vec4 vs_Col;             

out float time;            

const vec4 lightPos = vec4(5, 5, 20, 1); 

void main()
{
    time = float(u_Time);

    gl_Position = vs_Pos;

    
                                             
}
