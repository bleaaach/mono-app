import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import {
  exportAllData,
  importFromJSON,
  restoreData,
  getBackupMetadata,
  saveBackupToFile,
  formatFileSize,
  formatDate,
  BackupMetadata,
  clearAllData,
  exportAllLifeLogsToCSV,
} from '../utils/backupUtils';
import { FontSizes, scaleFont } from '../utils/responsive';
import { DownloadIcon, UploadIcon, FileSpreadsheetIcon, TrashIcon } from '../components/Icons';

export default function SettingsScreen() {
  const [metadata, setMetadata] = useState<BackupMetadata | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 加载数据概览
  const loadMetadata = useCallback(async () => {
    const data = await getBackupMetadata();
    setMetadata(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMetadata();
    }, [loadMetadata])
  );

  // 导出数据
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const backupData = await exportAllData();
      await saveBackupToFile(backupData);

      if (Platform.OS !== 'web') {
        Alert.alert('导出成功', '备份文件已保存到应用文档目录');
      }
    } catch (error) {
      Alert.alert('导出失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据 - 从文本
  const handleImportFromText = async () => {
    if (!importText.trim()) {
      Alert.alert('错误', '请输入备份数据');
      return;
    }

    try {
      setIsImporting(true);
      const backupData = importFromJSON(importText.trim());
      const meta = await getBackupMetadata(backupData);

      const alertMessage = `备份信息:\n` +
        `导出时间: ${formatDate(meta.exportDate)}\n` +
        `数据大小: ${formatFileSize(meta.dataSize)}\n` +
        `待办: ${meta.itemCounts.todos} 条\n` +
        `习惯: ${meta.itemCounts.habits} 个\n` +
        `日记: ${meta.itemCounts.diaries} 篇\n` +
        `收纳物品: ${meta.itemCounts.storageItems} 件\n\n` +
        '选择导入方式：';

      if (Platform.OS === 'web') {
        // Web 平台使用 confirm
        const result = window.confirm(alertMessage + '\n\n点击确定进行完全替换，点击取消使用合并模式（跳过重复）');
        if (result) {
          confirmFullReplace(backupData);
        } else {
          performImport(backupData, { merge: true, skipExisting: true });
        }
      } else {
        Alert.alert(
          '确认导入',
          alertMessage,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '合并（跳过重复）',
              onPress: () => performImport(backupData, { merge: true, skipExisting: true }),
            },
            {
              text: '合并（覆盖重复）',
              onPress: () => performImport(backupData, { merge: true, skipExisting: false }),
            },
            {
              text: '完全替换',
              onPress: () => confirmFullReplace(backupData),
              style: 'destructive',
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('导入失败', error instanceof Error ? error.message : '无效的备份数据格式');
    } finally {
      setIsImporting(false);
    }
  };

  // 确认完全替换
  const confirmFullReplace = (backupData: any) => {
    if (Platform.OS === 'web') {
      const result = window.confirm('警告\n\n完全替换将删除所有现有数据，确定要继续吗？');
      if (result) {
        performImport(backupData, { merge: false });
      }
    } else {
      Alert.alert(
        '警告',
        '完全替换将删除所有现有数据，确定要继续吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定替换',
            style: 'destructive',
            onPress: () => performImport(backupData, { merge: false }),
          },
        ]
      );
    }
  };

  // 执行导入
  const performImport = async (
    backupData: any,
    options: { merge?: boolean; skipExisting?: boolean }
  ) => {
    try {
      await restoreData(backupData, options);
      setShowImportModal(false);
      setImportText('');
      await loadMetadata();
      if (Platform.OS === 'web') {
        window.alert('导入成功！数据已成功恢复。');
      } else {
        Alert.alert('导入成功', '数据已成功恢复');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      if (Platform.OS === 'web') {
        window.alert('导入失败: ' + errorMsg);
      } else {
        Alert.alert('导入失败', errorMsg);
      }
    }
  };

  // 清空所有数据
  const handleClearAll = () => {
    const confirmClear = async () => {
      try {
        await clearAllData();
        await loadMetadata();
        if (Platform.OS === 'web') {
          window.alert('已清空！所有数据已被删除。建议重新启动应用以确保所有页面刷新。');
        } else {
          Alert.alert(
            '已清空',
            '所有数据已被删除。建议重新启动应用以确保所有页面刷新。',
            [{ text: '确定' }]
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        if (Platform.OS === 'web') {
          window.alert('操作失败: ' + errorMsg);
        } else {
          Alert.alert('操作失败', errorMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      const result = window.confirm('清空所有数据\n\n此操作将永久删除所有数据，无法恢复。确定要继续吗？');
      if (result) {
        confirmClear();
      }
    } else {
      Alert.alert(
        '清空所有数据',
        '此操作将永久删除所有数据，无法恢复。确定要继续吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定清空',
            style: 'destructive',
            onPress: confirmClear,
          },
        ]
      );
    }
  };

  // 渲染数据概览项
  const renderStatItem = (label: string, value: number) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 数据概览 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据概览</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              {renderStatItem('待办', metadata?.itemCounts.todos || 0)}
              {renderStatItem('习惯', metadata?.itemCounts.habits || 0)}
              {renderStatItem('日记', metadata?.itemCounts.diaries || 0)}
            </View>
            <View style={styles.statsRow}>
              {renderStatItem('时间记录', metadata?.itemCounts.timeEntries || 0)}
              {renderStatItem('收纳物品', metadata?.itemCounts.storageItems || 0)}
              {renderStatItem('空间', metadata?.itemCounts.storageSpaces || 0)}
            </View>
            {metadata && (
              <View style={styles.storageInfo}>
                <Text style={styles.storageText}>
                  数据大小: {formatFileSize(metadata.dataSize)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 数据备份 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据备份</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleExport}
            disabled={isExporting}
          >
            <View style={styles.menuIcon}>
              <DownloadIcon size={20} color={Colors.background} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>导出数据 (JSON)</Text>
              <Text style={styles.menuDesc}>将所有数据导出为 JSON 文件</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowImportModal(true)}
          >
            <View style={styles.menuIcon}>
              <UploadIcon size={20} color={Colors.background} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>导入数据</Text>
              <Text style={styles.menuDesc}>从备份文件恢复数据</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 数据导出 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据导出</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              try {
                await exportAllLifeLogsToCSV();
                if (Platform.OS !== 'web') {
                  Alert.alert('导出成功', 'CSV 文件已保存到应用文档目录');
                }
              } catch (error) {
                Alert.alert('导出失败', error instanceof Error ? error.message : '未知错误');
              }
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#059669' }]}>
              <FileSpreadsheetIcon size={20} color={Colors.background} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>导出日志 (CSV)</Text>
              <Text style={styles.menuDesc}>将 Life Log 数据导出为 CSV 格式</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 危险操作 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>危险操作</Text>

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleClearAll}
          >
            <View style={[styles.menuIcon, styles.dangerIcon]}>
              <TrashIcon size={20} color={Colors.background} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, styles.dangerText]}>清空所有数据</Text>
              <Text style={styles.menuDesc}>永久删除所有数据，无法恢复</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 应用信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>MONO</Text>
            <Text style={styles.appVersion}>版本 1.0.0</Text>
            <Text style={styles.appDesc}>极简生活管理应用</Text>
          </View>
        </View>
      </ScrollView>

      {/* 导入弹窗 */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>导入数据</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              请将备份文件的 JSON 内容粘贴到下方：
            </Text>

            <TextInput
              style={styles.importInput}
              multiline
              placeholder="粘贴备份数据..."
              placeholderTextColor={Colors.textMuted}
              value={importText}
              onChangeText={setImportText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleImportFromText}
                disabled={isImporting}
              >
                <Text style={styles.confirmButtonText}>
                  {isImporting ? '导入中...' : '导入'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  storageInfo: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  storageText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    color: Colors.background,
    fontWeight: '600',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  menuDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dangerTitle: {
    color: Colors.error,
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
  },
  dangerIcon: {
    backgroundColor: Colors.error,
  },
  dangerText: {
    color: Colors.error,
  },
  aboutCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  appDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  modalDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  importInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    height: 200,
    fontSize: FontSizes.sm,
    color: Colors.text,
    backgroundColor: Colors.gray[50],
    textAlignVertical: 'top',
    lineHeight: Platform.OS === 'android' ? scaleFont(20) : undefined,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
    }),
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});
