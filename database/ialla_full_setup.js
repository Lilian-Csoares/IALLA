/** ialla_full_setup.js
 *  Cria/atualiza TODO o schema do banco "ialla" (coleções, validações e índices).
 *  Pode ser executado várias vezes sem problemas (idempotente).
 */

function ensureColl(name, opts = {}) {
  const exists = db.getCollectionNames().includes(name);
  if (!exists) {
    db.createCollection(name, opts);
    print(`✔ criada: ${name}`);
  } else {
    if (opts.validator) {
      db.runCommand({
        collMod: name,
        validator: opts.validator,
        validationLevel: "strict",
        validationAction: "error",
      });
      print(`✔ schema atualizado: ${name}`);
    } else {
      print(`• existente (sem alteração de schema): ${name}`);
    }
  }
}

use("ialla");

/* ============================================================
 * 1) USUÁRIOS (com cidade e estado)
 * ============================================================ */
ensureColl("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "usuario", "email", "senha_hash", "criado_em", "atualizado_em"],
      properties: {
        nome:          { bsonType: "string", maxLength: 120 },
        usuario:       { bsonType: "string", maxLength: 40 },
        email:         { bsonType: "string", maxLength: 190 },
        telefone:      { bsonType: ["string", "null"] },
        bio:           { bsonType: ["string", "null"] },
        avatar_url:    { bsonType: ["string", "null"] },
        senha_hash:    { bsonType: "string" },
        status:        { bsonType: ["string", "null"] },
        criado_em:     { bsonType: "date" },
        atualizado_em: { bsonType: "date" },
        cpf:           { bsonType: ["string", "null"], maxLength: 14 },

        // Novos campos
        cidade:        { bsonType: ["string", "null"], maxLength: 80 },
        estado:        { bsonType: ["string", "null"], maxLength: 2 } // UF (ex.: SP)
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});
db.usuarios.createIndex({ usuario: 1 }, { unique: true });
db.usuarios.createIndex({ email: 1 },   { unique: true });
db.usuarios.createIndex(
  { cpf: 1 },
  { unique: true, partialFilterExpression: { cpf: { $type: "string" } } }
);
// Segmentação por região
db.usuarios.createIndex({ estado: 1, cidade: 1 });
db.usuarios.createIndex({ cidade: 1 });

/* ============================================================
 * 2) SEGUIDORES
 * ============================================================ */
ensureColl("seguidores", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["seguidor_id", "seguido_id", "criado_em"],
    properties: {
      seguidor_id: { bsonType: "objectId" },
      seguido_id:  { bsonType: "objectId" },
      criado_em:   { bsonType: "date" }
    }
  } }
});
db.seguidores.createIndex({ seguidor_id: 1, seguido_id: 1 }, { unique: true });
db.seguidores.createIndex({ seguido_id: 1 });

/* ============================================================
 * 3) EVENTOS
 * ============================================================ */
ensureColl("eventos", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["produtor_id", "titulo", "local", "criado_em", "atualizado_em"],
    properties: {
      produtor_id:   { bsonType: "objectId" },
      titulo:        { bsonType: "string", maxLength: 160 },
      local:         { bsonType: "string", maxLength: 160 },
      endereco:      { bsonType: ["string", "null"] },
      data_inicio:   { bsonType: ["date", "null"] },
      data_fim:      { bsonType: ["date", "null"] },
      cardapio_url:  { bsonType: ["string", "null"] },
      capa_url:      { bsonType: ["string", "null"] },
      status:        { bsonType: ["string", "null"] },
      criado_em:     { bsonType: "date" },
      atualizado_em: { bsonType: "date" }
    }
  } }
});
db.eventos.createIndex({ produtor_id: 1 });
db.eventos.createIndex({ data_inicio: 1, data_fim: 1 });

/* ============================================================
 * 4) INTERESSE_EVENTO
 * ============================================================ */
ensureColl("interesse_evento", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "evento_id"],
    properties: {
      usuario_id:    { bsonType: "objectId" },
      evento_id:     { bsonType: "objectId" },
      atualizado_em: { bsonType: ["date", "null"] }
    }
  } }
});
db.interesse_evento.createIndex({ usuario_id: 1, evento_id: 1 }, { unique: true });
db.interesse_evento.createIndex({ evento_id: 1 });

/* ============================================================
 * 5) FAVORITOS_EVENTO
 * ============================================================ */
ensureColl("favoritos_evento", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "evento_id"],
    properties: {
      usuario_id: { bsonType: "objectId" },
      evento_id:  { bsonType: "objectId" },
      criado_em:  { bsonType: ["date", "null"] }
    }
  } }
});
db.favoritos_evento.createIndex({ usuario_id: 1, evento_id: 1 }, { unique: true });
db.favoritos_evento.createIndex({ evento_id: 1 });

/* ============================================================
 * 6) INGRESSOS
 * ============================================================ */
ensureColl("ingressos", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "evento_id", "criado_em"],
    properties: {
      usuario_id: { bsonType: "objectId" },
      evento_id:  { bsonType: "objectId" },
      qr_token:   { bsonType: ["string", "null"] },
      criado_em:  { bsonType: "date" },
      usado_em:   { bsonType: ["date", "null"] }
    }
  } }
});
db.ingressos.createIndex({ usuario_id: 1 });
db.ingressos.createIndex({ evento_id: 1 });

/* ============================================================
 * 7) CHECKINS
 * ============================================================ */
ensureColl("checkins", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["ingresso_id", "lido_por", "criado_em"],
    properties: {
      ingresso_id: { bsonType: "objectId" },
      lido_por:    { bsonType: "objectId" },
      criado_em:   { bsonType: "date" }
    }
  } }
});
db.checkins.createIndex({ ingresso_id: 1 });
db.checkins.createIndex({ lido_por: 1 });

/* ============================================================
 * 8) POSTS
 * ============================================================ */
ensureColl("posts", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["autor_id", "criado_em", "atualizado_em"],
    properties: {
      autor_id:     { bsonType: "objectId" },
      texto:        { bsonType: ["string", "null"] },
      localizacao:  { bsonType: ["object", "null"] },
      midias: {
        bsonType: ["array", "null"],
        items: {
          bsonType: "object",
          required: ["url"],
          properties: {
            url:   { bsonType: "string" },
            ordem: { bsonType: ["int", "long"] }
          }
        }
      },
      comentarios: {
        bsonType: ["array", "null"],
        items: {
          bsonType: "object",
          required: ["_id", "autor_id", "texto", "criado_em"],
          properties: {
            _id:       { bsonType: "objectId" },
            autor_id:  { bsonType: "objectId" },
            texto:     { bsonType: "string" },
            criado_em: { bsonType: "date" }
          }
        }
      },
      total_curtidas: { bsonType: ["int", "long", "null"] },
      criado_em:      { bsonType: "date" },
      atualizado_em:  { bsonType: "date" }
    }
  } }
});
db.posts.createIndex({ autor_id: 1 });
db.posts.createIndex({ criado_em: -1 });

/* ============================================================
 * 9) CURTIDAS
 * ============================================================ */
ensureColl("curtidas", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "post_id", "criado_em"],
    properties: {
      usuario_id: { bsonType: "objectId" },
      post_id:    { bsonType: "objectId" },
      criado_em:  { bsonType: "date" }
    }
  } }
});
db.curtidas.createIndex({ usuario_id: 1, post_id: 1 }, { unique: true });
db.curtidas.createIndex({ post_id: 1 });

/* ============================================================
 * 10) STORIES (TTL por expiração)
 * ============================================================ */
ensureColl("stories", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "criado_em", "expira_em", "segmentos"],
    properties: {
      usuario_id: { bsonType: "objectId" },
      criado_em:  { bsonType: "date" },
      expira_em:  { bsonType: "date" },
      segmentos: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["midia_url", "ordem", "criado_em"],
          properties: {
            midia_url: { bsonType: "string" },
            ordem:     { bsonType: ["int", "long"] },
            criado_em: { bsonType: "date" }
          }
        }
      }
    }
  } }
});
db.stories.createIndex({ usuario_id: 1 });
db.stories.createIndex({ expira_em: 1 }, { expireAfterSeconds: 0 });

/* ============================================================
 * 11) STORY_VIEWS
 * ============================================================ */
ensureColl("story_views", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["story_id", "viewer_id", "visto_em"],
    properties: {
      story_id:  { bsonType: "objectId" },
      viewer_id: { bsonType: "objectId" },
      visto_em:  { bsonType: "date" }
    }
  } }
});
db.story_views.createIndex({ story_id: 1, viewer_id: 1 }, { unique: true });
db.story_views.createIndex({ viewer_id: 1 });

/* ============================================================
 * 12) NOTIFICAÇÕES
 * ============================================================ */
ensureColl("notificacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "lido", "criado_em"],
      properties: {
        usuario_id: { bsonType: "objectId" },
        lido:       { bsonType: "bool" },
        criado_em:  { bsonType: "date" },
        payload:    { bsonType: ["object", "null"] } // dados extras da notificação
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.notificacoes.createIndex({ usuario_id: 1, lido: 1, criado_em: -1 });


/* ============================================================
 * 13) CONVERSAS
 * ============================================================ */
ensureColl("conversas", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["criado_em", "participantes"],
    properties: {
      evento_id:     { bsonType: ["objectId", "null"] },
      criado_em:     { bsonType: "date" },
      ultimo_msg_em: { bsonType: ["date", "null"] },
      participantes: {
        bsonType: "array",
        minItems: 2,
        items: {
          bsonType: "object",
          required: ["usuario_id"],
          properties: {
            usuario_id:     { bsonType: "objectId" },
            ultimo_visto_em:{ bsonType: ["date", "null"] }
          }
        }
      }
    }
  } }
});
db.conversas.createIndex({ evento_id: 1 });
db.conversas.createIndex({ "participantes.usuario_id": 1 });

/* ============================================================
 * 14) MENSAGENS
 * ============================================================ */
ensureColl("mensagens", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["conversa_id", "autor_id", "criado_em"],
    properties: {
      conversa_id: { bsonType: "objectId" },
      autor_id:    { bsonType: "objectId" },
      texto:       { bsonType: ["string", "null"] },
      midia_url:   { bsonType: ["string", "null"] },
      criado_em:   { bsonType: "date" }
    }
  } }
});
db.mensagens.createIndex({ conversa_id: 1, criado_em: 1 });
db.mensagens.createIndex({ autor_id: 1 });

/* ============================================================
 * 15) CARTEIRAS
 * ============================================================ */
ensureColl("carteiras", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["usuario_id", "saldo_centavos", "criado_em", "atualizado_em"],
    properties: {
      usuario_id:     { bsonType: "objectId" },
      saldo_centavos: { bsonType: "long" },
      criado_em:      { bsonType: "date" },
      atualizado_em:  { bsonType: "date" }
    }
  } }
});
db.carteiras.createIndex({ usuario_id: 1 }, { unique: true });

/* ============================================================
 * 16) CARTEIRA_TRANSACOES
 * ============================================================ */
ensureColl("carteira_transacoes", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["carteira_id", "tipo", "finalidade", "valor_centavos", "status", "criado_em"],
    properties: {
      carteira_id:   { bsonType: "objectId" },
      tipo:          { enum: ["credito", "debito"] },
      finalidade:    { enum: ["add_saldo", "compra_ingresso"] },
      valor_centavos:{ bsonType: "long", minimum: 1 },
      status:        { enum: ["pendente", "confirmado", "falhou"] },
      descricao:     { bsonType: ["string", "null"] },
      criado_em:     { bsonType: "date" },
      confirmado_em: { bsonType: ["date", "null"] }
    }
  } }
});
db.carteira_transacoes.createIndex({ carteira_id: 1, criado_em: -1 });
db.carteira_transacoes.createIndex({ status: 1 });

print("\n✅ Schema do banco 'ialla' criado/atualizado com sucesso.\n");

/* ============================================================
 * (Opcional) Seed mínimo de exemplo
 *  - Para ativar, mude SEED para true antes de rodar.
 * ============================================================ */
const SEED = false;

if (SEED) {
  const now = new Date();
  // cria 1 usuário produtor
  const uId = db.usuarios.insertOne({
    nome: "Produtor Demo",
    usuario: "produtor_demo",
    email: "produtor@demo.com",
    senha_hash: "hash_demo",
    criado_em: now,
    atualizado_em: now,
    cidade: "São Paulo",
    estado: "SP",
  }).insertedId;

  // cria um evento
  const evId = db.eventos.insertOne({
    produtor_id: uId,
    titulo: "Festival Demo",
    local: "Parque Central",
    endereco: "Rua Exemplo, 123",
    data_inicio: new Date(now.getTime() + 86400000),
    data_fim: new Date(now.getTime() + 2*86400000),
    criado_em: now,
    atualizado_em: now
  }).insertedId;

  // cria carteira
  const cId = db.carteiras.insertOne({
    usuario_id: uId,
    saldo_centavos: NumberLong(0),
    criado_em: now,
    atualizado_em: now
  }).insertedId;

  print(`• Seed criado. usuario=${uId}, evento=${evId}, carteira=${cId}`);
}