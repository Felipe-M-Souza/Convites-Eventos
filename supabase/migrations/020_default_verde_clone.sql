-- Copia o convite default para /c/default-verde e liga o modelo verde.
-- O slug default permanece como está. Rodar no SQL Editor depois da 019.

insert into public.invite_config (id, slug, payload)
select
  'default-verde',
  'default-verde',
  payload || jsonb_build_object(
    'inviteTheme', 'sage',
    'sageEyebrow', 'Nosso casamento',
    'parentsLeftLabel', 'Da noiva',
    'parentsLeftNames', 'Família de Elaine',
    'parentsRightLabel', 'Do noivo',
    'parentsRightNames', 'Família de Leonardo',
    'dayProgramHeading', 'Programa do dia',
    'dayProgram', jsonb_build_array(
      jsonb_build_object('time', '15:00', 'title', 'Cerimônia na Paróquia Nossa Senhora do Brasil'),
      jsonb_build_object('time', '18:00', 'title', 'Recepção no Terraço Itália'),
      jsonb_build_object('time', '19:30', 'title', 'Jantar'),
      jsonb_build_object('time', '21:00', 'title', 'Corte do bolo'),
      jsonb_build_object('time', '21:30', 'title', 'Dança e festa')
    ),
    'guestbookEnabled', true,
    'guestbookHeading', 'Livro de mensagens',
    'guestbookSamples', jsonb_build_array(
      jsonb_build_object('name', 'Marina', 'message', 'Que este dia seja leve e cheio de gente querida.'),
      jsonb_build_object('name', 'Paulo e Helena', 'message', 'Estaremos aí para brindar com vocês.'),
      jsonb_build_object('name', 'Amigos da faculdade', 'message', 'Que a festa tenha a cara de vocês: alegre e sem pressa.')
    )
  )
from public.invite_config
where slug = 'default'
  and not exists (
    select 1 from public.invite_config where slug = 'default-verde'
  );
