-- Restaura as imagens do convite demonstrativo (`slug = default`) para os padrões do projeto.
-- Executar no Supabase: SQL Editor -> Run.

update public.invite_config
set payload =
  payload
  || jsonb_build_object(
    'openingFrameImageUrl', '',
    'openingBackdropColor', '',
    'openingEnvelopeImageUrl', '/images/envelope-burgundy.png',
    'openingEnvelopeOpenImageUrl', '/images/envelope-open.png',
    'openingEnvelopeNaturalWidth', 1024,
    'openingEnvelopeNaturalHeight', 682,
    'openingEnvelopeOpenNaturalWidth', null,
    'openingEnvelopeOpenNaturalHeight', null,
    'openingEnvelopeTextureZoom', null,
    'openingEnvelopeBoxWidthMaxPx', null,
    'openingEnvelopeBoxHeightVhCap', null,
    'openingEnvelopeBoxMaxHeightPx', null,
    'coverImageUrl', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'galleryPhotos', jsonb_build_array(
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80'
    )
  )
where slug = 'default';
