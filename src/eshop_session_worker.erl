-module(eshop_session_worker).

-behaviour(gen_server).
 
-export([start_link/1]).
 
%% gen_server callbacks
-export([
  init/1
  ,handle_call/3
  ,handle_cast/2
  ,handle_info/2
  ,terminate/2
  ,code_change/3
]).

-include("eshop.hrl").

-define(SESSION_TIMEOUT,10000). 
-define(EXIT_TIMEOUT,1000).
-record(state, {sid}).

%% ---------------------------------------------------------------------------- 
%% ---------------------------------------------------------------------------- 
%% ---------------------------------------------------------------------------- 

start_link(Args) ->
  gen_server:start_link(?MODULE, Args, []).

init(Args) ->
  gproc:reg(?WORKER_KEY(Args),ignore),
  {ok, #state{sid=Args}, ?SESSION_TIMEOUT}.
 
handle_call(Msg, _From, State) ->
  io:fwrite("call ~p~n",[Msg]),
  {reply, ignored, State, ?SESSION_TIMEOUT}.

handle_cast(stop, State) ->
  {stop, normal, State};
handle_cast(Msg, State) ->
  io:fwrite("cast ~p~n",[Msg]),
  {noreply, State, ?SESSION_TIMEOUT}.

%% -- termination 
handle_info({conn_terminate}, State) ->
  {noreply, State,?EXIT_TIMEOUT};

%% -- timeout
handle_info(timeout, State) ->
  gen_server:cast(self(),stop),
  {noreply, State};

handle_info(Req, #state{sid=Sid} = State)  ->
  Sleep = eshop_utls:gen_rand_int(1, 3000),
  io:fwrite("Sleep ~p~n",[Sleep]),
  io:fwrite("Request ~p~n",[Req]),
  timer:sleep(Sleep),
  Parsed = jsx:decode(Req),
  Operation = eshop_utls:get_value(<<"operation">>,Parsed,undefined),
  Data = eshop_utls:get_value(<<"data">>,Parsed,undefined),
  CbId = eshop_utls:get_value(<<"cbid">>,Parsed,undefined),
  dispatch_request({Operation,Data,CbId},Sid),
  {noreply, State, ?SESSION_TIMEOUT}.

terminate(_Reason, #state{sid=Sid} = _State) ->
  gproc:unreg(?WORKER_KEY(Sid)),
  ok.
 
code_change(_OldVsn, State, _Extra) ->
  {ok, State}.

%% ----------------------------------------------------------------------------
%% ----------------- JSON ROUTING AND AUTHORISATION CHECKING ------------------
%% ----------------------------------------------------------------------------

dispatch_request({<<"partials">>,Data,CbId},Sid) ->
  eshop:partials({Sid,CbId},Data);

dispatch_request({<<"register">>,Data,CbId},Sid) ->
  eshop:new_registration({Sid,CbId},Data);

dispatch_request({<<"login">>,Data,CbId},Sid) ->
  eshop:authenticate({Sid,CbId},Data);

dispatch_request({Op,Data,CbId},Sid) when Op =:= <<"categories">> orelse Op =:= <<"items">> ->
  Action = eshop_utls:get_value(<<"action">>,Data,undefined),
  Token = eshop_utls:get_value(<<"token">>,Data,undefined),
  dispatch_request_action({Op,Action,Token,Data,CbId},Sid);

dispatch_request({Type,Data,_CbId},_Sid) -> 
  io:fwrite("UNHANDLED::: ~p ~p ~n",[Type,Data]).

%% ----------------------------------------------------------------------------

dispatch_request_action({<<"categories">>,<<"fetch">>,Token,Data,CbId},Sid) ->
  Auth = eshop_session:is_authorised(Token),
  dispatch_authorised_request({<<"categories">>,<<"fetch">>,Data,CbId},Sid,Auth);

dispatch_request_action({<<"items">>,<<"fetch">>,Token,Data,CbId},Sid) ->
  Auth = eshop_session:is_authorised(Token),
  dispatch_authorised_request({<<"items">>,<<"fetch">>,Data,CbId},Sid,Auth);

dispatch_request_action({Op,Action,Token,Data,CbId},Sid) -> 
  Auth = eshop_session:is_authorised(Token),
  Record = estore:json_to_record(Data),
  dispatch_authorised_request({Op,Action,Record,CbId},Sid,Auth).

%% ----------------------------------------------------------------------------

dispatch_authorised_request({Op,Action,Data,CbId},Sid,{ok,TokenData}) ->
  io:fwrite("AUTH RECEIVED::: ~p ~p ~p ~n",[Op,Data,CbId]),
  Method = binary_to_atom(Op,'utf8'),
  eshop:Method({Sid,CbId},Action,Data,TokenData);
dispatch_authorised_request({Type,Action,Data,CbId},Sid,{error,_TokenData}) ->
  io:fwrite("UNAUTH RECEIVED::: ~p ~p ~p ~n",[Type,Data,CbId]),
  eshop:error_reply({Sid,CbId},Type,Action,<<"error">>,[{<<"msg">>,<<"Unauthorised">>}]).


