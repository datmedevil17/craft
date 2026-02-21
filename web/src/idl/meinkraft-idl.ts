export default {
  "address": "72WYk7b352n3SFb3k1qGmPnKDY2dUvr5rgK55RNa14Yt",
  "metadata": {
    "name": "meinkraft",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "attack",
      "docs": [
        "Record an attack event"
      ],
      "discriminator": [
        197,
        26,
        63,
        242,
        77,
        247,
        101,
        119
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "meinkraft_account.authority",
                "account": "MeinkraftAccount"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session_token",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "target_type",
          "type": "string"
        },
        {
          "name": "damage",
          "type": "u8"
        }
      ]
    },
    {
      "name": "commit",
      "docs": [
        "Manual commit state to base layer"
      ],
      "discriminator": [
        223,
        140,
        142,
        165,
        229,
        208,
        156,
        74
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "magic_program",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magic_context",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegate",
      "docs": [
        "Delegate the account to the ER"
      ],
      "discriminator": [
        90,
        147,
        75,
        178,
        85,
        88,
        4,
        137
      ],
      "accounts": [
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "buffer_pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                89,
                137,
                28,
                146,
                30,
                72,
                105,
                191,
                96,
                5,
                128,
                13,
                207,
                122,
                206,
                99,
                159,
                4,
                145,
                167,
                166,
                48,
                53,
                3,
                76,
                201,
                78,
                92,
                245,
                232,
                127,
                213
              ]
            }
          }
        },
        {
          "name": "delegation_record_pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegation_program"
            }
          }
        },
        {
          "name": "delegation_metadata_pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegation_program"
            }
          }
        },
        {
          "name": "pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "owner_program",
          "address": "72WYk7b352n3SFb3k1qGmPnKDY2dUvr5rgK55RNa14Yt"
        },
        {
          "name": "delegation_program",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "end_game",
      "docs": [
        "End the active game session"
      ],
      "discriminator": [
        224,
        135,
        245,
        99,
        67,
        175,
        121,
        252
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "meinkraft_account.authority",
                "account": "MeinkraftAccount"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session_token",
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "enter_game",
      "docs": [
        "Enter the game session"
      ],
      "discriminator": [
        157,
        184,
        173,
        203,
        193,
        117,
        106,
        66
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "meinkraft_account.authority",
                "account": "MeinkraftAccount"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session_token",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "realm",
          "type": "string"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize a new Meinkraft player account"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "kill_entity",
      "docs": [
        "Record an entity kill"
      ],
      "discriminator": [
        169,
        200,
        135,
        58,
        71,
        150,
        207,
        238
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "meinkraft_account.authority",
                "account": "MeinkraftAccount"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session_token",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "entity_type",
          "type": "string"
        },
        {
          "name": "score_reward",
          "type": "u64"
        }
      ]
    },
    {
      "name": "place_block",
      "docs": [
        "Record a block placement event"
      ],
      "discriminator": [
        184,
        154,
        18,
        192,
        205,
        185,
        38,
        139
      ],
      "accounts": [
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "meinkraft_account.authority",
                "account": "MeinkraftAccount"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session_token",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "block_type",
          "type": "string"
        }
      ]
    },
    {
      "name": "process_undelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "base_account",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "system_program"
        }
      ],
      "args": [
        {
          "name": "account_seeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "undelegate",
      "docs": [
        "Undelegate the account from the ER"
      ],
      "discriminator": [
        131,
        148,
        180,
        198,
        91,
        104,
        42,
        238
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "meinkraft_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "magic_program",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magic_context",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "MeinkraftAccount",
      "discriminator": [
        54,
        101,
        169,
        16,
        133,
        249,
        216,
        55
      ]
    },
    {
      "name": "SessionToken",
      "discriminator": [
        233,
        4,
        115,
        14,
        46,
        21,
        1,
        15
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoActiveSession",
      "msg": "No active session"
    },
    {
      "code": 6001,
      "name": "InvalidRealm",
      "msg": "Invalid realm name"
    },
    {
      "code": 6002,
      "name": "InvalidAuth",
      "msg": "Invalid authentication"
    }
  ],
  "types": [
    {
      "name": "MeinkraftAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "realm",
            "type": "string"
          },
          {
            "name": "blocks_placed",
            "type": "u64"
          },
          {
            "name": "attacks",
            "type": "u64"
          },
          {
            "name": "kills",
            "type": "u64"
          },
          {
            "name": "score",
            "type": "u64"
          },
          {
            "name": "games_played",
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "SessionToken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "target_program",
            "type": "pubkey"
          },
          {
            "name": "session_signer",
            "type": "pubkey"
          },
          {
            "name": "valid_until",
            "type": "i64"
          }
        ]
      }
    }
  ]
}