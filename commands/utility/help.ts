import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, Interaction } from "discord.js";

class HelpMenu {
    private pages: EmbedBuilder[];
    private currentPage: number;

    constructor() {
        this.pages = [
            new EmbedBuilder()
                .setTitle("ヘルプ - 基本コマンド")
                .setDescription("基本的なコマンドの一覧です。")
                .addFields(
                    { name: "/join", value: "ボイスチャンネルに接続し、指定したテキストチャンネルのメッセージを読み上げます。" },
                    { name: "/leave", value: "ボイスチャンネルから切断します。" },
                    { name: "/ping", value: "BOTの応答時間をテストします。" },
                    { name: "/invite", value: "BOTの招待リンクを表示します。" },
                    { name: "/status", value: "BOTの現在の状態と接続情報を表示します。" },
                    { name: "/help", value: "このヘルプメニューを表示します。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - 読み上げコマンド")
                .setDescription("読み上げ機能に関するコマンドです。")
                .addFields(
                    { name: "/speak", value: "テキストを直接読み上げます。オプションで優先度を設定可能です。" },
                    { name: "/queue status", value: "現在の読み上げキューの状態を表示します。" },
                    { name: "/queue clear", value: "読み上げキューをクリアします。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - 自動入室コマンド")
                .setDescription("自動入室に関するコマンドの一覧です。")
                .addFields(
                    { name: "/register_auto_join", value: "BOTの自動入室機能を登録します。" },
                    { name: "/unregister_auto_join", value: "自動接続の設定を解除します。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - 音声設定コマンド")
                .setDescription("音声設定に関するコマンドの一覧です。")
                .addFields(
                    { name: "/set_speaker", value: "話者を選択メニューから切り替えます。" },
                    { name: "/set_volume", value: "音量を設定します (0.0 - 2.0)。" },
                    { name: "/set_pitch", value: "音高を設定します (-1.0 - 1.0)。" },
                    { name: "/set_speed", value: "話速を設定します (0.5 - 2.0)。" },
                    { name: "/set_style_strength", value: "スタイルの強さを設定します (0.0 - 2.0)。" },
                    { name: "/set_tempo", value: "テンポの緩急を設定します (0.5 - 2.0)。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - 辞書コマンド")
                .setDescription("辞書に関するコマンドの一覧です。")
                .addFields(
                    { name: "/add_word", value: "辞書に単語を登録します。" },
                    { name: "/edit_word", value: "辞書の単語を編集します。" },
                    { name: "/remove_word", value: "辞書から単語を削除します。" },
                    { name: "/list_words", value: "辞書の単語一覧を表示します。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - Premium機能")
                .setDescription("有料プランで利用できる機能の一覧です。")
                .addFields(
                    { name: "/voice-history list", value: "Pro版: 最近の読み上げ履歴を表示します。" },
                    { name: "/voice-history search", value: "Pro版: 履歴をキーワードで検索します。" },
                    { name: "/voice-history user", value: "Pro版: 特定ユーザーの履歴を表示します。" },
                    { name: "/voice-history clear", value: "Premium版: 履歴をクリアします。" },
                    { name: "/subscription info", value: "サブスクリプション情報を確認します。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - キュー処理と読み上げ優先度")
                .setDescription("読み上げメッセージは優先度に基づいてキュー処理されます。")
                .addFields(
                    { name: "優先度：高", value: "システム通知や優先コマンドは他のメッセージより先に読み上げられます。" },
                    { name: "優先度：通常", value: "一般的なメッセージは通常の優先度で処理されます。" },
                    { name: "優先度：低", value: "長文やURLを多く含むメッセージは低優先度で処理されます。" },
                    { name: "キューの管理", value: "/queue コマンドでキューの状態確認やクリアができます。" }
                )
                .setColor(0x3498db),
            new EmbedBuilder()
                .setTitle("ヘルプ - その他の機能")
                .setDescription("その他の便利な機能の説明です。")
                .addFields(
                    { name: "メンション読み上げ", value: "ユーザーメンションは自動的にユーザー名に変換されて読み上げられます。" },
                    { name: "URL省略", value: "URLは「URL省略」と読み上げられます。" },
                    { name: "スポイラー省略", value: "スポイラータグは「ネタバレ」と読み上げられます。" },
                    { name: "絵文字変換", value: "カスタム絵文字は「絵文字」と読み上げられます。" },
                    { name: "読み上げ停止", value: "メッセージ冒頭に「(音量0)」と付けると読み上げません。" },
                    { name: "コードブロック", value: "コードブロック（```で囲まれた部分）は読み上げられません。" }
                )
                .setColor(0x3498db)
        ];
        this.currentPage = 0;
    }

    public getCurrentPage(): EmbedBuilder {
        return this.pages[this.currentPage];
    }

    public nextPage(): EmbedBuilder {
        this.currentPage = (this.currentPage + 1) % this.pages.length;
        return this.getCurrentPage();
    }

    public previousPage(): EmbedBuilder {
        this.currentPage = (this.currentPage - 1 + this.pages.length) % this.pages.length;
        return this.getCurrentPage();
    }

    public getTotalPages(): number {
        return this.pages.length;
    }

    // currentPageのゲッターを追加
    public getCurrentPageNumber(): number {
        return this.currentPage;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('ヘルプメニューを表示します'),
        
    async execute(interaction: ChatInputCommandInteraction) {
        const helpMenu = new HelpMenu();
        const embed = helpMenu.getCurrentPage();
        
        // ページ情報を埋め込みに追加
        embed.setFooter({ 
            text: `ページ ${helpMenu.getCurrentPageNumber() + 1}/${helpMenu.getTotalPages()} • Aivis-chan` 
        });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('前へ')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('次へ')
                    .setStyle(ButtonStyle.Primary)
            );

        const response = await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            fetchReply: true
        });

        const filter = (i: Interaction) => {
            if (i.user.id !== interaction.user.id) return false;
            return (i as ButtonInteraction).customId === 'previous' || (i as ButtonInteraction).customId === 'next';
        };
        
        const collector = response.createMessageComponentCollector({ 
            filter, 
            time: 300000 // 5分間有効
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === 'previous') {
                const newEmbed = helpMenu.previousPage();
                // ページ情報を更新
                newEmbed.setFooter({ 
                    text: `ページ ${helpMenu.getCurrentPageNumber() + 1}/${helpMenu.getTotalPages()} • Aivis-chan` 
                });
                await i.update({ embeds: [newEmbed] });
            } else if (i.customId === 'next') {
                const newEmbed = helpMenu.nextPage();
                // ページ情報を更新
                newEmbed.setFooter({ 
                    text: `ページ ${helpMenu.getCurrentPageNumber() + 1}/${helpMenu.getTotalPages()} • Aivis-chan` 
                });
                await i.update({ embeds: [newEmbed] });
            }
        });

        collector.on('end', async () => {
            // ボタンを無効化
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('前へ')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('次へ')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
            
            try {
                await interaction.editReply({ components: [disabledRow] });
            } catch (error) {
                console.error('ヘルプメニューのボタンを無効化できませんでした:', error);
            }
        });
    }
};