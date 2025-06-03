import { IconButton, Popover, PopoverTrigger,Button, PopoverContent, PopoverBody, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import type { SocketMessage } from 'lib/socket/types';
import type { IndexingStatus } from 'types/api/indexingStatus';

import useApiQuery, { getResourceKey } from 'lib/api/useApiQuery';
import { apos, nbsp, ndash } from 'lib/html-entities';
import useSocketChannel from 'lib/socket/useSocketChannel';
import useSocketMessage from 'lib/socket/useSocketMessage';
import useToast from 'lib/hooks/useToast';
import IconSvg from 'ui/shared/IconSvg';
const IntTxsIndexingStatus = () => {
  const toast = useToast();
  const { data, isError, isPending } = useApiQuery('homepage_indexing_status');

  const bgColor = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const hintTextcolor = useColorModeValue('black', 'white');

  const queryClient = useQueryClient();

  const handleInternalTxsIndexStatus: SocketMessage.InternalTxsIndexStatus['handler'] = React.useCallback((payload) => {
    queryClient.setQueryData(getResourceKey('homepage_indexing_status'), (prevData: IndexingStatus | undefined) => {

      const newData = prevData ? { ...prevData } : {} as IndexingStatus;
      newData.finished_indexing = payload.finished;
      newData.indexed_internal_transactions_ratio = payload.ratio;

      return newData;
    });
  }, [ queryClient ]);

  const internalTxsIndexingChannel = useSocketChannel({
    topic: 'blocks:indexing_internal_transactions',
    isDisabled: !data || data.finished_indexing,
  });

  useSocketMessage({
    channel: internalTxsIndexingChannel,
    event: 'internal_txs_index_status',
    handler: handleInternalTxsIndexStatus,
  });

  if (isError || isPending) {
    return null;
  }

  if (data.finished_indexing !== false) {
    return null;
  }

  const hint = (
    <Text fontSize="xs" color={ hintTextcolor }>
      { data.indexed_internal_transactions_ratio &&
        `${ Math.floor(Number(data.indexed_internal_transactions_ratio) * 100) }% Blocks With Internal Transactions Indexed${ nbsp }${ ndash } ` }
      We{ apos }re indexing this chain right now. Some of the counts may be inaccurate.
    </Text>
  );

  const trigger = (
    <Flex
      px={ 2 }
      py={ 1 }
      bg={ bgColor }
      borderRadius="base"
      alignItems="center"
      justifyContent="center"
      color="green.400"
      _hover={{ color: 'blue.400' }}
    >
      <IconButton
        colorScheme="none"
        aria-label="hint"
        icon={ <IconSvg name="info" boxSize={ 5 }/> }
        boxSize={ 6 }
        variant="simple"
      />
      { data.indexed_internal_transactions_ratio && (
        <Text fontWeight={ 600 } fontSize="xs" color="inherit">
          { Math.floor(Number(data.indexed_internal_transactions_ratio) * 100) + '%' }
        </Text>
      ) }
    </Flex>
  );
  const handleAddNetwork = async () => {
    try{
    // 检查是否已经连接
    const accounts = await window?.ethereum?.request({ method: 'eth_requestAccounts' });
    // if(accounts && accounts.length > 0) {
    //   return (<Alert status="success">
    //            <Text>Success</Text>
    //             <Text>Successfully added network to your wallet</Text>
    //          </Alert>)
    // }
    if (!accounts || accounts.length === 0) {
      console.error('No accounts found'); 
      return;
    }
    const chainID = '0x7B1';
    try {
    // 尝试切换网络
    await window?.ethereum?.request({ // 切换网络成功
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainID }],
    });
    toast({
      position: 'top-right',
      title: 'Success',
      description: 'Successfully added network to your wallet',
      status: 'success',
      variant: 'subtle',
      isClosable: true,
    });
    }catch (error:any) { // 表示没有这个网络 添加网络
      if (error.code === 4902) {
        try {
           window?.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainID,
                chainName: 'TSCS Network',
                nativeCurrency: {
                  name: "TSCS Network",
                  symbol: 'TSCS',
                  decimals: 18,
                },
                rpcUrls: [
                  "https://testnetrpc.scschain.com"
                ],
                blockExplorerUrls: [
                  "https://testnetscan.scschain.com/"
                ],
                iconUrls: [""],
              },
            ],
          }).catch(e=>{
            toast({
              position: 'top-right',
              title: 'error',
              description: e.message,
              status: 'error',
              variant: 'subtle',
              isClosable: true,
            });
          })
        } catch (addError:any) {
          toast({
            position: 'top-right',
            title: 'error',
            description: addError.message,
            status: 'error',
            variant: 'subtle',
            isClosable: true,
          });
        }
      } else {
       
      }
    }
  }catch (error) {
    console.error("Unexpected error:", error);
  }
  }
  const MaskButton = (
    <Button
      size="sm"
      w="auto"
      variant='outline'
      px={3}
      onClick={handleAddNetwork}
    >
    <IconSvg name="wallets/metamask" mr={ 3 } w={ 5 } h={ 5 }/>
      Add TSCS Network
    </Button>
    
  );
  return (
    <Popover placement="bottom-start" isLazy trigger="hover">
      <PopoverTrigger>
        { trigger }
      </PopoverTrigger>
      { MaskButton }
      <PopoverContent maxH="450px" overflowY="hidden" w="240px">
        <PopoverBody p={ 4 } bgColor={ bgColor } boxShadow="2xl">
          { hint }
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default IntTxsIndexingStatus;
