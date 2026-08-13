import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Megaphone,
  Users,
  X,
} from "lucide-react-native";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  adminCampaignFetch,
  cleanCampaignText,
  LEAD_TYPES,
  MetaTemplate,
  META_PROVIDER,
  normalizeVariableDefinitions,
  templateDisplayName,
} from "../../../lib/adminCampaigns";

type PickerMode =
  | "template"
  | "lead"
  | null;

export default function CreateCampaignScreen() {
  const router = useRouter();

  const [
    templates,
    setTemplates,
  ] =
    useState<MetaTemplate[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    pickerMode,
    setPickerMode,
  ] =
    useState<PickerMode>(null);

  const [
    name,
    setName,
  ] = useState("");

  const [
    templateName,
    setTemplateName,
  ] = useState("");

  const [
    leadType,
    setLeadType,
  ] = useState("agent");

  const [
    batchSize,
    setBatchSize,
  ] = useState("100");

  const [
    recipientText,
    setRecipientText,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    variableValues,
    setVariableValues,
  ] =
    useState<Record<string, string>>(
      {}
    );

  const selectedTemplate =
    useMemo(() => {
      return (
        templates.find(
          (template) =>
            template.template_name ===
            templateName
        ) || null
      );
    }, [
      templates,
      templateName,
    ]);

  const variableDefinitions =
    useMemo(() => {
      return normalizeVariableDefinitions(
        selectedTemplate
      );
    }, [selectedTemplate]);

  const selectedLead =
    LEAD_TYPES.find(
      (item) =>
        item.value === leadType
    );

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");

      const response =
        await adminCampaignFetch();

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to load approved Meta templates."
        );
      }

      const nextTemplates =
        (result.templates ||
          []) as MetaTemplate[];

      setTemplates(
        nextTemplates
      );

      if (
        nextTemplates.length >
        0
      ) {
        applyTemplate(
          nextTemplates[0]
        );
      }
    } catch (err: any) {
      console.error(
        "Load campaign templates error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load approved Meta templates."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(
    template: MetaTemplate
  ) {
    setTemplateName(
      template.template_name
    );

    const definitions =
      normalizeVariableDefinitions(
        template
      );

    const nextValues: Record<
      string,
      string
    > = {};

    for (
      const definition of definitions
    ) {
      nextValues[
        String(
          definition.position
        )
      ] =
        definition.example ||
        "";
    }

    setVariableValues(
      nextValues
    );
  }

  function buildDefaultVariables() {
    const result: Record<
      string,
      string
    > = {};

    for (
      const definition of variableDefinitions
    ) {
      const value =
        cleanCampaignText(
          variableValues[
            String(
              definition.position
            )
          ]
        );

      if (value) {
        result[
          String(
            definition.position
          )
        ] = value;
      }
    }

    return result;
  }

  async function createCampaign() {
    if (creating) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      if (
        !selectedTemplate
      ) {
        throw new Error(
          "Select an approved Meta template."
        );
      }

      if (!name.trim()) {
        throw new Error(
          "Campaign name is required."
        );
      }

      if (
        !recipientText.trim()
      ) {
        throw new Error(
          "Add at least one recipient phone number."
        );
      }

      const defaultVariables =
        buildDefaultVariables();

      const missing =
        variableDefinitions.filter(
          (definition) =>
            !cleanCampaignText(
              defaultVariables[
                String(
                  definition.position
                )
              ]
            )
        );

      if (
        missing.length > 0
      ) {
        throw new Error(
          `Enter ${missing
            .map(
              (item) =>
                item.label
            )
            .join(", ")}.`
        );
      }

      const parsedBatch =
        Number(batchSize);

      const cleanBatchSize =
        Number.isFinite(
          parsedBatch
        ) &&
        parsedBatch > 0
          ? Math.min(
              Math.floor(
                parsedBatch
              ),
              500
            )
          : 100;

      const response =
        await adminCampaignFetch(
          "",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                name:
                  name.trim(),
                templateName:
                  selectedTemplate.template_name,
                leadType,
                batchSize:
                  cleanBatchSize,
                recipients:
                  recipientText,
                defaultVariables,
                notes:
                  notes.trim(),
                sendProvider:
                  META_PROVIDER,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to create campaign."
        );
      }

      const invalidCount =
        Array.isArray(
          result.invalidRecipients
        )
          ? result
              .invalidRecipients
              .length
          : 0;

      Alert.alert(
        "Campaign Created",
        `${result.totalRecipients || 0} recipient(s) added as pending.${
          invalidCount > 0
            ? ` ${invalidCount} invalid number(s) were ignored.`
            : ""
        }\n\nNo WhatsApp messages have been sent yet.`,
        [
          {
            text: "OK",
            onPress: () =>
              router.replace(
                "/admin/campaigns" as any
              ),
          },
        ]
      );
    } catch (err: any) {
      console.error(
        "Create campaign error:",
        err
      );

      setError(
        err?.message ||
          "Failed to create campaign."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={
          styles.flex
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={18}
              color="#171717"
            />
          </Pressable>

          <View
            style={
              styles.headerCopy
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              META WHATSAPP
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Create Campaign
            </Text>
          </View>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        <ScrollView
          style={
            styles.flex
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={
              styles.introCard
            }
          >
            <View
              style={
                styles.introIcon
              }
            >
              <Megaphone
                size={21}
                color="#8A6818"
              />
            </View>

            <View
              style={
                styles.introCopy
              }
            >
              <Text
                style={
                  styles.introTitle
                }
              >
                New Meta Campaign
              </Text>

              <Text
                style={
                  styles.introText
                }
              >
                Create the recipient list first. Messages are only sent later when you process a batch.
              </Text>
            </View>
          </View>

          {error ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View
              style={
                styles.loadingBox
              }
            >
              <ActivityIndicator
                color="#B8892E"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading approved Meta templates...
              </Text>
            </View>
          ) : (
            <>
              <FormCard
                title="Campaign"
                subtitle="Name and approved Meta template"
                icon={
                  <FileText
                    size={18}
                    color="#8A6818"
                  />
                }
              >
                <FieldLabel>
                  Campaign Name
                </FieldLabel>

                <TextInput
                  value={name}
                  onChangeText={
                    setName
                  }
                  placeholder="Example: Agent Membership Invitation"
                  placeholderTextColor="#AAA39A"
                  style={
                    styles.input
                  }
                />

                <FieldLabel>
                  Approved Meta Template
                </FieldLabel>

                <Pressable
                  style={
                    styles.selectButton
                  }
                  onPress={() =>
                    setPickerMode(
                      "template"
                    )
                  }
                  disabled={
                    templates.length ===
                    0
                  }
                >
                  <View
                    style={
                      styles.selectCopy
                    }
                  >
                    <Text
                      numberOfLines={
                        1
                      }
                      style={
                        styles.selectValue
                      }
                    >
                      {selectedTemplate
                        ? templateDisplayName(
                            selectedTemplate
                          )
                        : "No active templates"}
                    </Text>

                    {selectedTemplate ? (
                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.selectSubvalue
                        }
                      >
                        {
                          selectedTemplate.template_name
                        }
                      </Text>
                    ) : null}
                  </View>

                  <ChevronDown
                    size={17}
                    color="#777169"
                  />
                </Pressable>

                {selectedTemplate ? (
                  <TemplatePreview
                    template={
                      selectedTemplate
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.warningBox
                    }
                  >
                    <Text
                      style={
                        styles.warningText
                      }
                    >
                      No active approved Meta templates are available.
                    </Text>
                  </View>
                )}
              </FormCard>

              {variableDefinitions.length >
              0 ? (
                <FormCard
                  title="Template Variables"
                  subtitle="Default values used for each recipient"
                >
                  {variableDefinitions.map(
                    (
                      definition
                    ) => (
                      <View
                        key={
                          definition.position
                        }
                      >
                        <FieldLabel>
                          {
                            definition.label
                          }{" "}
                          <Text
                            style={
                              styles.variableTag
                            }
                          >
                            {"{{"}
                            {
                              definition.position
                            }
                            {"}}"}
                          </Text>
                        </FieldLabel>

                        <TextInput
                          value={
                            variableValues[
                              String(
                                definition.position
                              )
                            ] || ""
                          }
                          onChangeText={(
                            value
                          ) =>
                            setVariableValues(
                              (
                                current
                              ) => ({
                                ...current,
                                [String(
                                  definition.position
                                )]:
                                  value,
                              })
                            )
                          }
                          placeholder={
                            definition.example ||
                            `Enter value for {{${definition.position}}}`
                          }
                          placeholderTextColor="#AAA39A"
                          style={
                            styles.input
                          }
                        />
                      </View>
                    )
                  )}
                </FormCard>
              ) : selectedTemplate ? (
                <View
                  style={
                    styles.noVariables
                  }
                >
                  <Check
                    size={15}
                    color="#24714D"
                  />

                  <Text
                    style={
                      styles.noVariablesText
                    }
                  >
                    This template has no body variables.
                  </Text>
                </View>
              ) : null}

              <FormCard
                title="Recipients"
                subtitle="Lead type, batch size and phone numbers"
                icon={
                  <Users
                    size={18}
                    color="#8A6818"
                  />
                }
              >
                <View
                  style={
                    styles.twoColumn
                  }
                >
                  <View
                    style={
                      styles.column
                    }
                  >
                    <FieldLabel>
                      Lead Type
                    </FieldLabel>

                    <Pressable
                      style={
                        styles.smallSelect
                      }
                      onPress={() =>
                        setPickerMode(
                          "lead"
                        )
                      }
                    >
                      <Text
                        style={
                          styles.smallSelectText
                        }
                      >
                        {selectedLead?.label ||
                          "Agent"}
                      </Text>

                      <ChevronDown
                        size={15}
                        color="#777169"
                      />
                    </Pressable>
                  </View>

                  <View
                    style={
                      styles.column
                    }
                  >
                    <FieldLabel>
                      Batch Size
                    </FieldLabel>

                    <TextInput
                      value={
                        batchSize
                      }
                      onChangeText={(
                        value
                      ) =>
                        setBatchSize(
                          value.replace(
                            /[^0-9]/g,
                            ""
                          )
                        )
                      }
                      keyboardType="number-pad"
                      placeholder="100"
                      placeholderTextColor="#AAA39A"
                      style={
                        styles.input
                      }
                    />
                  </View>
                </View>

                <Text
                  style={
                    styles.helper
                  }
                >
                  Maximum batch size: 500.
                </Text>

                <FieldLabel>
                  Phone Numbers
                </FieldLabel>

                <TextInput
                  value={
                    recipientText
                  }
                  onChangeText={
                    setRecipientText
                  }
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  placeholder={
                    "Paste one phone number per line:\n628123456789\n08123456789\n+628123456789"
                  }
                  placeholderTextColor="#AAA39A"
                  style={[
                    styles.input,
                    styles.recipientInput,
                  ]}
                />

                <Text
                  style={
                    styles.helper
                  }
                >
                  Indonesian 08 or 8 numbers are normalized to country code 62 by the server. Duplicate and invalid numbers are handled by the backend.
                </Text>
              </FormCard>

              <FormCard
                title="Internal Notes"
                subtitle="Optional — only visible to admins"
              >
                <TextInput
                  value={notes}
                  onChangeText={
                    setNotes
                  }
                  multiline
                  textAlignVertical="top"
                  placeholder="Optional internal campaign notes"
                  placeholderTextColor="#AAA39A"
                  style={[
                    styles.input,
                    styles.notesInput,
                  ]}
                />
              </FormCard>

              <View
                style={
                  styles.safetyCard
                }
              >
                <Text
                  style={
                    styles.safetyTitle
                  }
                >
                  Creating does not send
                </Text>

                <Text
                  style={
                    styles.safetyText
                  }
                >
                  Recipients will be created as Pending. You will review the campaign before using Continue Pending to send a batch.
                </Text>
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  (
                    creating ||
                    !name.trim() ||
                    !selectedTemplate ||
                    !recipientText.trim()
                  ) &&
                    styles.submitDisabled,
                ]}
                disabled={
                  creating ||
                  !name.trim() ||
                  !selectedTemplate ||
                  !recipientText.trim()
                }
                onPress={() =>
                  void createCampaign()
                }
              >
                {creating ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Megaphone
                    size={17}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.submitText
                  }
                >
                  {creating
                    ? "Creating Campaign..."
                    : "Create Meta Campaign"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        <PickerSheet
          visible={
            pickerMode !==
            null
          }
          title={
            pickerMode ===
            "template"
              ? "Select Meta Template"
              : "Select Lead Type"
          }
          onClose={() =>
            setPickerMode(
              null
            )
          }
        >
          {pickerMode ===
          "template"
            ? templates.map(
                (
                  template
                ) => {
                  const active =
                    template.template_name ===
                    templateName;

                  return (
                    <Pressable
                      key={
                        template.id
                      }
                      style={[
                        styles.pickerOption,
                        active &&
                          styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        applyTemplate(
                          template
                        );
                        setPickerMode(
                          null
                        );
                      }}
                    >
                      <View
                        style={
                          styles.pickerOptionCopy
                        }
                      >
                        <Text
                          style={[
                            styles.pickerOptionTitle,
                            active &&
                              styles.pickerOptionTitleActive,
                          ]}
                        >
                          {templateDisplayName(
                            template
                          )}
                        </Text>

                        <Text
                          numberOfLines={
                            1
                          }
                          style={[
                            styles.pickerOptionSubtitle,
                            active &&
                              styles.pickerOptionSubtitleActive,
                          ]}
                        >
                          {
                            template.template_name
                          }{" "}
                          ·{" "}
                          {
                            template.language_code
                          }{" "}
                          ·{" "}
                          {
                            template.category
                          }
                        </Text>
                      </View>

                      {active ? (
                        <Check
                          size={18}
                          color="#FFFFFF"
                        />
                      ) : null}
                    </Pressable>
                  );
                }
              )
            : LEAD_TYPES.map(
                (item) => {
                  const active =
                    item.value ===
                    leadType;

                  return (
                    <Pressable
                      key={
                        item.value
                      }
                      style={[
                        styles.pickerOption,
                        active &&
                          styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setLeadType(
                          item.value
                        );
                        setPickerMode(
                          null
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionTitle,
                          active &&
                            styles.pickerOptionTitleActive,
                        ]}
                      >
                        {
                          item.label
                        }
                      </Text>

                      {active ? (
                        <Check
                          size={18}
                          color="#FFFFFF"
                        />
                      ) : null}
                    </Pressable>
                  );
                }
              )}
        </PickerSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.formCard
      }
    >
      <View
        style={
          styles.formHeader
        }
      >
        {icon ? (
          <View
            style={
              styles.formIcon
            }
          >
            {icon}
          </View>
        ) : null}

        <View
          style={
            styles.formHeaderCopy
          }
        >
          <Text
            style={
              styles.formTitle
            }
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={
                styles.formSubtitle
              }
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={
          styles.formBody
        }
      >
        {children}
      </View>
    </View>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <Text
      style={
        styles.fieldLabel
      }
    >
      {children}
    </Text>
  );
}

function TemplatePreview({
  template,
}: {
  template: MetaTemplate;
}) {
  return (
    <View
      style={
        styles.templatePreview
      }
    >
      <View
        style={
          styles.previewBadgeRow
        }
      >
        <View
          style={
            styles.categoryPill
          }
        >
          <Text
            style={
              styles.categoryPillText
            }
          >
            {
              template.category
            }
          </Text>
        </View>

        <View
          style={
            styles.activePill
          }
        >
          <Text
            style={
              styles.activePillText
            }
          >
            {
              template.meta_status
            }
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.previewMeta
        }
      >
        Language:{" "}
        {
          template.language_code
        }{" "}
        · Variables:{" "}
        {
          template.variable_count ||
          0
        }
      </Text>

      {template.body_text ? (
        <View
          style={
            styles.messagePreview
          }
        >
          <Text
            style={
              styles.messagePreviewText
            }
          >
            {
              template.body_text
            }
          </Text>
        </View>
      ) : null}

      {template.footer_text ? (
        <Text
          style={
            styles.previewFooter
          }
        >
          Footer:{" "}
          {
            template.footer_text
          }
        </Text>
      ) : null}

      {template.website_button_text ? (
        <Text
          style={
            styles.previewFooter
          }
        >
          Website button:{" "}
          {
            template.website_button_text
          }
        </Text>
      ) : null}

      {template.quick_reply_text ? (
        <Text
          style={
            styles.previewFooter
          }
        >
          Quick reply:{" "}
          {
            template.quick_reply_text
          }
        </Text>
      ) : null}
    </View>
  );
}

function PickerSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={
        onClose
      }
    >
      <Pressable
        style={
          styles.modalBackdrop
        }
        onPress={
          onClose
        }
      >
        <Pressable
          style={
            styles.sheet
          }
          onPress={() => {}}
        >
          <View
            style={
              styles.sheetHandle
            }
          />

          <View
            style={
              styles.sheetHeader
            }
          >
            <Text
              style={
                styles.sheetTitle
              }
            >
              {title}
            </Text>

            <Pressable
              style={
                styles.closeButton
              }
              onPress={
                onClose
              }
            >
              <X
                size={18}
                color="#171717"
              />
            </Pressable>
          </View>

          <ScrollView
            style={
              styles.sheetScroll
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <View
              style={
                styles.pickerList
              }
            >
              {children}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    header: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#E5DED4",
      backgroundColor:
        "#F7F5EF",
    },

    backButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    headerCopy: {
      alignItems: "center",
    },

    headerSpacer: {
      width: 38,
    },

    eyebrow: {
      color: "#A17B2A",
      fontSize: 7.5,
      fontWeight: "900",
      letterSpacing: 1,
    },

    title: {
      marginTop: 2,
      color: "#171717",
      fontSize: 17,
      fontWeight: "900",
    },

    content: {
      padding: 16,
      paddingBottom: 55,
      gap: 12,
    },

    introCard: {
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E2D8C6",
      backgroundColor:
        "#FFFDF8",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    introIcon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor:
        "#F6E9C8",
      alignItems: "center",
      justifyContent:
        "center",
    },

    introCopy: {
      flex: 1,
    },

    introTitle: {
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    introText: {
      marginTop: 3,
      color: "#777169",
      fontSize: 9,
      lineHeight: 13,
      fontWeight: "600",
    },

    errorBox: {
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#EDC0C0",
      backgroundColor:
        "#FFF0F0",
    },

    errorText: {
      color: "#A23C3C",
      fontSize: 9.5,
      lineHeight: 14,
      fontWeight: "700",
    },

    loadingBox: {
      minHeight: 180,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 9,
    },

    loadingText: {
      color: "#777169",
      fontSize: 9.5,
      fontWeight: "700",
    },

    formCard: {
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
    },

    formHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 13,
    },

    formIcon: {
      width: 36,
      height: 36,
      borderRadius: 13,
      backgroundColor:
        "#F6E9C8",
      alignItems: "center",
      justifyContent:
        "center",
    },

    formHeaderCopy: {
      flex: 1,
    },

    formTitle: {
      color: "#171717",
      fontSize: 12,
      fontWeight: "900",
    },

    formSubtitle: {
      marginTop: 2,
      color: "#918A82",
      fontSize: 8.5,
      lineHeight: 12,
      fontWeight: "600",
    },

    formBody: {
      gap: 9,
    },

    fieldLabel: {
      marginTop: 2,
      color: "#706A63",
      fontSize: 7.5,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.7,
    },

    input: {
      minHeight: 45,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFEFB",
      color: "#171717",
      fontSize: 10.5,
      fontWeight: "600",
    },

    selectButton: {
      minHeight: 52,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFEFB",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    selectCopy: {
      flex: 1,
      minWidth: 0,
    },

    selectValue: {
      color: "#171717",
      fontSize: 10.5,
      fontWeight: "800",
    },

    selectSubvalue: {
      marginTop: 2,
      color: "#918A82",
      fontSize: 7.5,
      fontWeight: "600",
    },

    templatePreview: {
      marginTop: 2,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#C8DAEA",
      backgroundColor:
        "#F2F8FD",
    },

    previewBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },

    categoryPill: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#D7C2F2",
      backgroundColor:
        "#F5EEFF",
    },

    categoryPillText: {
      color: "#7146A0",
      fontSize: 7,
      fontWeight: "900",
      textTransform:
        "capitalize",
    },

    activePill: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#B9DEC8",
      backgroundColor:
        "#EEF9F2",
    },

    activePillText: {
      color: "#24714D",
      fontSize: 7,
      fontWeight: "900",
      textTransform:
        "capitalize",
    },

    previewMeta: {
      marginTop: 9,
      color: "#5F6B75",
      fontSize: 8,
      lineHeight: 12,
      fontWeight: "700",
    },

    messagePreview: {
      marginTop: 9,
      padding: 11,
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#D8E5F0",
    },

    messagePreviewText: {
      color: "#4E555B",
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "600",
    },

    previewFooter: {
      marginTop: 7,
      color: "#7B858D",
      fontSize: 7.8,
      lineHeight: 12,
      fontWeight: "600",
    },

    variableTag: {
      color: "#A17B2A",
      textTransform:
        "none",
    },

    warningBox: {
      padding: 11,
      borderRadius: 14,
      backgroundColor:
        "#FFF8E1",
      borderWidth: 1,
      borderColor:
        "#E7CF79",
    },

    warningText: {
      color: "#8A6818",
      fontSize: 9,
      fontWeight: "700",
    },

    noVariables: {
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#B9DEC8",
      backgroundColor:
        "#EEF9F2",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    noVariablesText: {
      color: "#24714D",
      fontSize: 9,
      fontWeight: "800",
    },

    twoColumn: {
      flexDirection: "row",
      gap: 8,
    },

    column: {
      flex: 1,
      minWidth: 0,
      gap: 9,
    },

    smallSelect: {
      minHeight: 45,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFEFB",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 6,
    },

    smallSelectText: {
      color: "#171717",
      fontSize: 9.5,
      fontWeight: "800",
    },

    recipientInput: {
      minHeight: 150,
    },

    notesInput: {
      minHeight: 85,
    },

    helper: {
      marginTop: -2,
      color: "#999188",
      fontSize: 7.8,
      lineHeight: 12,
      fontWeight: "600",
    },

    safetyCard: {
      padding: 13,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#E2D8C6",
      backgroundColor:
        "#FFFDF8",
    },

    safetyTitle: {
      color: "#8A6818",
      fontSize: 9.5,
      fontWeight: "900",
    },

    safetyText: {
      marginTop: 3,
      color: "#777169",
      fontSize: 8.5,
      lineHeight: 13,
      fontWeight: "600",
    },

    submitButton: {
      minHeight: 49,
      borderRadius: 16,
      backgroundColor:
        "#171717",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    submitDisabled: {
      opacity: 0.38,
    },

    submitText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.34)",
      justifyContent:
        "flex-end",
    },

    sheet: {
      maxHeight: "78%",
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 28,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor:
        "#F7F5EF",
    },

    sheetHandle: {
      alignSelf: "center",
      width: 38,
      height: 4,
      borderRadius: 999,
      backgroundColor:
        "#CEC7BD",
      marginBottom: 12,
    },

    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 10,
    },

    sheetTitle: {
      color: "#171717",
      fontSize: 16,
      fontWeight: "900",
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    sheetScroll: {
      flexGrow: 0,
    },

    pickerList: {
      gap: 7,
      paddingBottom: 8,
    },

    pickerOption: {
      minHeight: 53,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    pickerOptionActive: {
      backgroundColor:
        "#171717",
      borderColor:
        "#171717",
    },

    pickerOptionCopy: {
      flex: 1,
      minWidth: 0,
    },

    pickerOptionTitle: {
      color: "#171717",
      fontSize: 10,
      fontWeight: "900",
    },

    pickerOptionTitleActive: {
      color: "#FFFFFF",
    },

    pickerOptionSubtitle: {
      marginTop: 3,
      color: "#918A82",
      fontSize: 7.5,
      fontWeight: "600",
    },

    pickerOptionSubtitleActive: {
      color:
        "rgba(255,255,255,0.62)",
    },
  });
