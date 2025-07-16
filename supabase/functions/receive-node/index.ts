import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 環境変数の確認
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Missing environment variables'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Supabaseクライアントの作成
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const body = await req.json();
    const { type, data } = body;
    if (!type || !data) {
      return new Response(JSON.stringify({
        error: 'Missing type or data'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    switch(type){
      case 'node':
        // ノード作成
        const nodeData = {
          title: data.title,
          content: data.content || '',
          parent_ids: data.parent_ids || [],
          source_gpt: data.source_gpt || 'Unknown'
        };
        const { data: insertedNode, error: nodeError } = await supabaseClient.from('nodes').insert(nodeData).select();
        if (nodeError) {
          return new Response(JSON.stringify({
            error: 'Failed to create node',
            details: nodeError.message,
            code: nodeError.code
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        break;
      case 'criticism':
        // 批評作成
        const criticismData = {
          title: data.title,
          node_id: data.node_id,
          scholar_name: data.scholar_name,
          field: data.field || '',
          comment: data.comment,
          source_url: data.source_url || ''
        };
        const { data: insertedCriticism, error: criticismError } = await supabaseClient.from('criticisms').insert(criticismData).select();
        if (criticismError) {
          return new Response(JSON.stringify({
            error: 'Failed to create criticism',
            details: criticismError.message,
            code: criticismError.code
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        break;
      default:
        return new Response(JSON.stringify({
          error: 'Invalid type'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
