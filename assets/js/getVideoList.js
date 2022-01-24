let token = localStorage.getItem('access_token')

let Component = Vue.extend({
	template: '<p></p>'
})
Vue.component('go-top', Component)
new Vue({
	el: '#videoList',
	data: {
		// 工具版本号
		biliToolVersion: '3.2', // 2022.1.24 update
		toolId: 1,
		// ---------
		// 骨架屏
		isSkeleton: false,
		// ---------
		videolist: [],
		isLogin: false,
		isLoading: false,
		// 推荐列表索引
		idx: '',
		// 临时list
		item: [],
		loading: false,
		notifyPromise: Promise.resolve(),
		fullScreenLoading: false,
		loadMoreFlag: false,
		// 已关注直播列表
		liveList: [],
		// 检查动态新发视频
		dynamicCount: '0',
		isDynamicHide: true
	},
	methods: {
		// 搜索
		// search(e){
		// 	console.log(e)
		// },
		
		// 显示判断
		checkGoto(str){
			let isHaveUp = ['av', 'vertical_av', 'live', 'article', 'picture']
			if(isHaveUp.includes(str)){
				return true
			}else{
				return false
			}
		},
		
		// 限制标题的长度，以免溢出卡片
		titleLimited(title, maxLength){
			if(title.length > maxLength){
				return true
			}else{
				return false
			}
		},
		
		// idx索引判断大小，从而判断返回数组为正序还是倒序
		isHeadBiggerThanFoot(headIdx, footIdx){
			if(headIdx > footIdx){
				return true
			}else{
				return false
			}
		},
		
		// 显示通知
		showNotify(type, title, msg, duration = 4500){
			this.notifyPromise = this.notifyPromise.then(this.$nextTick).then(() => {
				this.$notify({
				    title: title,
				    message: msg,
					offset: 100,
					type: type,
					duration: duration
				});
			})
		},
		
		// 判断special_s的封面
		checkSpecialCover(url){
			if(url.includes("@")){
				return true
			}else{
				return false
			}
		},

// 下拉列表	START -----------------------------------------------------------------------------------------------------------		
		// 下拉列表前处理（视频卡片独有）
		beforeHandleCommand(command, content){
			return {
				'command': command,
				'content': content
			}
		},
		
		// 下拉列表操作（视频卡片独有）
		handleCommand(command){
			switch(command.command){
				// 稍后再看
				case 'a':
					this.addWatchLater(command.content)
					break;
				// 获取封面	
				case 'b':	
					this.navToCoverTool(command.content)
			}
			
		},
					
		// 稍后再看
		addWatchLater(aid){
			// 全屏加载
			const loading = this.$loading({
				lock: true,
				text: 'Loading',
				background: 'rgba(0, 0, 0, 0.7)'
			})
			$.ajax({
				url: baseUrl + '/addWatchLater',
				timeout: 30000,
				type: 'POST',
				data: {
					loginToken: token,
					aid: aid
				},
				success: (res) => {
					loading.close()
					// console.log(res)
					if(res.code == 200){
						this.showNotify('success', '搞定啦', '已添加到稍后再看', 2000)
					}else{
						this.showNotify('error', '出现问题', '（错误代码: ' + res.code + '）')
					}
				},
				complete: (res, status) => {
					if(status == 'timeout'){
						this.showNotify('error', '错误', '加载超时，请刷新页面', 0)
						loading.close()
					}else if(status == 'error'){
						this.showNotify('error', '错误', '网络连接中断，请检查网络状况', 0)
						loading.close()
					}
				}
			})
		},
		
		// 获取封面
		navToCoverTool(cover){
			window.open(cover, '_blank')
		},
		
// 下拉列表	END -----------------------------------------------------------------------------------------------------------		
		// 获取用户关注的直播列表
		getLiveList(){
			$.ajax({
				url: baseUrl + '/getLiveList',
				type: 'GET',
				data: {
					loginToken: token
				},
				success: (res) => {
					if(res.code == 200){
						this.liveList = res.data.data.rooms
					}
				}
			})
		},
		
		// 拿视频列表（首次）
		getVideoList(){
			// 全屏加载
			const loading = this.$loading({
				lock: true,
				text: 'Loading',
				background: 'rgba(0, 0, 0, 0.7)'
			})
			// this.isLoading = true
			$.ajax({
				url: baseUrl + '/getVideoList',
				timeout: 30000,
				type: 'GET',
				data: {
					loginToken: token,
					idx: this.idx
				},
				success: (res) => {
					// console.log(res)
					// this.isLoading = false
					// loading.close()
					if(res.code == 200){
						// 列表
						const videoList = res.data.data.items
						// console.log(videoList)
						// 获取头尾idx
						const headIdx = res.data.data.items.slice(0,1)[0].idx
						const footIdx = res.data.data.items.slice(-1)[0].idx
						// 判断获取的数组是正序还是倒序
						if(this.isHeadBiggerThanFoot(headIdx, footIdx)){
							// 倒序
							this.idx = footIdx
							// 转成正序
							this.videolist = videoList.reverse()
						}else{
							// 正序
							this.idx = headIdx
							this.videolist = videoList
						}
						// 登录鉴定
						if(res.data.isLogin){
							this.isLogin = true
							this.showNotify('info', '提示', '已登录', 1500)
						}else{
							this.showNotify('warning', '提示', '由于你尚未登录，为你获取全站推荐视频，或点击登录按钮登录')
						}
					}else{
						this.showNotify('error',
										'错误',
										'获取推荐视频列表时出现问题（错误代码: ' + res.code + '）', 0)
					}
					loading.close()
				},
				complete: (res, status) => {
					if(status == 'timeout'){
						this.showNotify('error', '错误', '加载超时，请刷新页面', 0)
						loading.close()
					}else if(status == 'error'){
						this.showNotify('error', '错误', '网络连接中断，请检查网络状况', 0)
						loading.close()
					}
				}
			})
			// this.showNotify('info', '提示', '点击版本号查看更新日志~')
		},
		
		// 拿更多视频，接在原list上
		moreVideoList(){
			// console.log('more')
			// 全屏加载
			const loading = this.$loading({
				lock: true,
				text: 'Loading',
				background: 'rgba(0, 0, 0, 0.7)'
			})
			// this.isLoading = true
			$.ajax({
				url: baseUrl + '/getVideoList',
				timeout: 30000,
				type: 'GET',
				data: {
					loginToken: token,
					idx: this.idx
				},
				success: (res) => {
					// console.log(res)
					// this.isLoading = false
					// loading.close()
					if(res.code == 200){
						// 列表
						const moreVideoList = res.data.data.items
						// console.log(moreVideoList)
						// 获取头尾idx
						const headIdx = res.data.data.items.slice(0,1)[0].idx
						const footIdx = res.data.data.items.slice(-1)[0].idx
						// 判断获取的数组是正序还是倒序
						if(this.isHeadBiggerThanFoot(headIdx, footIdx)){
							// 倒序
							this.idx = footIdx
							// 原列表正序
							const videoList = this.videolist
							// 将获得的列表正序并接在原列表后
							const newList = videoList.concat(moreVideoList.reverse())
							// 赋值
							this.videolist = newList
						}else{
							// 正序
							this.idx = headIdx
							// 将原列表正序
							const videoList = this.videolist
							// 将获得的列表接在原列表后
							const newList = videoList.concat(moreVideoList)
							// 赋值
							this.videolist = newList
						}
						this.showNotify('success', '好耶', '获得' + moreVideoList.length + '条新内容', 1000)
						// 登录鉴定
						if(res.data.isLogin){
							this.isLogin = true
						}else{
							this.showNotify('warning', '提示', '由于你尚未登录，为你获取全站推荐视频，或点击登录按钮登录')
						}
						loading.close()	
					}else{
						this.showNotify('error',
										'错误',
										'获取推荐视频列表时出现问题（错误代码: ' + res.code + '）')
					}
				},
				complete: (res, status) => {
					if(status == 'timeout'){
						this.showNotify('error', '错误', '加载超时，请刷新页面', 0)
						loading.close()
					}else if(status == 'error'){
						this.showNotify('error', '错误', '网络连接中断，请检查网络状况', 0)
						loading.close()
					}
				}
			})
		},
		
		// 退出登录前确认
		logOutConfirm() {
		    this.$confirm('是否退出登录?', '提示', {
		      confirmButtonText: '确定',
		      cancelButtonText: '取消',
		      type: 'warning',
			  closeOnHashChange: false
		    }).then(() => {
		      this.logOut()
		    }).catch(() => {         
		    });
		},
		
		// 退出登录（暂时写在这里吧）
		logOut(){
			$.ajax({
				url: baseUrl + '/logout',
				timeout: 30000,
				type: 'GET',
				data: {
					loginToken: token
				},
				success: (res) => {
					if(res.code == 200){
						this.isLogin = false
						localStorage.removeItem('access_token')
						this.showNotify('success', '提示','你已退出登录')
					}else{
						this.showNotify('error', '错误', '退出登录时出现问题, 请稍后再试')
					}
				},
				complete: (res, status) => {
					if(status == 'timeout'){
						this.showNotify('error', '错误', '加载超时，请刷新页面', 0)
						loading.close()
					}else if(status == 'error'){
						this.showNotify('error', '错误', '网络连接中断，请检查网络状况', 0)
						loading.close()
					}
				}
			})
		},
		
		// 计时器
		timer(){
			window.setInterval(() => {
				setTimeout(() => {
					this.getDynamicCount()
				}, 0)
			}, 60000)
		},
		
		// 拿动态角标
		getDynamicCount(){
			$.ajax({
				url: baseUrl + '/getDynamicCount',
				type: 'GET',
				data:{
					loginToken: token
				},
				success: (res) => {
					// console.log(res)
					if(res.code == 200){
						let alltype = res.data.data.alltype_num
						let article = res.data.data.article_num
						let video = res.data.data.video_num
						let total = alltype + article + video
						// console.log(total)
						if(total == 0){
							// console.log('re run...')
						}else{
							this.dynamicCount = total
							this.isDynamicHide = false
						}
					}	
				}
			})
		},
		
		// 点击动态按钮时，计数清零
		clickDynamicBtn(){
			this.dynamicCount = '0'
			this.isDynamicHide = true
		},
		
		// 获取工具最新版本
		updateNewestVersion(){
			$.ajax({
				url: baseUrl + '/vc/getToolVersion',
				type: 'GET',
				data:{
					toolId: this.toolId
				},
				success: (res) => {
					// console.log(res)
					if(res.code == 200){
						let newestVersion = res.data.toolVersion
						if(this.biliToolVersion === newestVersion){
							// console.log('nothing to update')
						}else{
							// console.log('update available')
							this.showNotify('warning', '更新已准备好!', '网页已有新版本，3秒后更新', 0)
							setTimeout(function(){
								// console.log('已更新好')
								window.location.reload(true)
							}, 3000)
						}
					}else{
						this.showNotify('error', '获取更新失败！(' + res.code + ')')
					}
				}
			})
		}
	},
	created(){
		this.updateNewestVersion()
		this.getVideoList()
		this.getLiveList()
		this.getDynamicCount()
		this.timer()
		console.log(
		'\n' + ' %c Bili Recommend Tool ' + ' %c v' + this.biliToolVersion + ' ' 
		+ '\n', 'color: #fadfa3; background: #030307; padding:5px 0;', 
		        'color: #242424; background: #fadfa3; padding:5px 0;');
	},
	mounted() {
		
	}
})